// ==UserScript==
// @name           CnC-TA SubSender - HE
// @namespace      https://github.com/Harzi66/CnC-TA-SubSender-Harzi-Edition
// @version        0.1.8
// @description    Automatische Spielervertretung für C&C Tiberium Alliances
// @author         Harzi66
// @match          https://*.alliances.commandandconquer.com/*/index.aspx*
// @downloadURL    https://raw.githubusercontent.com/Harzi66/CnC-TA-SubSender-Harzi-Edition/main/CnC-TA%20SubSender%20-%20Harzi%20Edition.user.js
// @updateURL      https://raw.githubusercontent.com/Harzi66/CnC-TA-SubSender-Harzi-Edition/main/CnC-TA%20SubSender%20-%20Harzi%20Edition.user.js
// @icon           https://raw.githubusercontent.com/Harzi66/CnC-TA-SubSender-Harzi-Edition/main/SubSender-Icon.png
// @grant          none
// ==/UserScript==


(function () {

    'use strict';

    const scriptName = 'SubSender - HE';

    const settingsKey =
          'HarziSubSender.Settings';

    let qxApp = null;
    let subSenderWindow = null;
    let automaticCheckTimer = null;


    // =========================================================
    // Farben
    // =========================================================

    const COLORS = {
        white: '#FFFFFF',
        yellow: '#FFD84A',
        green: '#45E65C',
        red: '#FF5555'
    };


    // =========================================================
    // Einstellungen laden
    // =========================================================

    function loadAllSettings() {

        try {

            const saved =
                  localStorage.getItem(settingsKey);

            if (!saved) {
                return {};
            }

            const data =
                  JSON.parse(saved);

            if (
                data &&
                typeof data === 'object' &&
                !Array.isArray(data)
            ) {
                return data;
            }

        } catch (e) {

            console.error(
                `${scriptName}: Fehler beim Laden der Einstellungen`,
                e
            );
        }

        return {};
    }


    // =========================================================
    // Einstellungen speichern
    // =========================================================

    function saveAllSettings(settings) {

        localStorage.setItem(
            settingsKey,
            JSON.stringify(settings)
        );
    }


    // =========================================================
    // Schlüssel für Welt + Allianz
    // =========================================================

    function getSettingsKey(
    worldId,
     allianceId
    ) {

        return `${worldId}_${allianceId}`;
    }


    // =========================================================
    // Einstellungen der aktuellen Welt laden
    // =========================================================

    function loadCurrentSettings(
    gameData
    ) {

        const allSettings =
              loadAllSettings();


        const key =
              getSettingsKey(
                  gameData.worldId,
                  gameData.allianceId
              );


        return {

            key: key,

            settings:
            allSettings[key] || {

                targetPlayer: '',
                enabled: false

            }
        };
    }


    // =========================================================
    // Einstellungen der aktuellen Welt speichern
    // =========================================================

    function saveCurrentSettings(
    gameData,
     targetPlayer,
     enabled
    ) {

        if (
            !gameData ||
            !gameData.worldId ||
            !gameData.allianceId
        ) {

            return;
        }


        const allSettings =
              loadAllSettings();


        const key =
              getSettingsKey(
                  gameData.worldId,
                  gameData.allianceId
              );


        allSettings[key] = {

            targetPlayer:
            String(targetPlayer || '').trim(),

            enabled:
            !!enabled
        };


        saveAllSettings(
            allSettings
        );


        console.log(
            `${scriptName}: Konfiguration automatisch gespeichert`,
            {
                worldId:
                gameData.worldId,

                allianceId:
                gameData.allianceId,

                targetPlayer:
                String(targetPlayer || '').trim(),

                enabled:
                !!enabled
            }
        );
    }


    // =========================================================
    // Label formatieren
    // =========================================================

    function styleLabel(
    label,
     color = COLORS.white,
     size = 15,
     bold = false
    ) {

        label.setTextColor(color);

        label.setFont(
            new qx.bom.Font(size).set({
                bold: bold
            })
        );
    }


    // =========================================================
    // Informationszeile
    // =========================================================

    function createInfoRow(
    icon,
     caption,
     value
    ) {

        const row =
              new qx.ui.container.Composite(
                  new qx.ui.layout.HBox(8)
              );


        row.setHeight(30);


        const iconLabel =
              new qx.ui.basic.Label(icon);


        iconLabel.set({

            width: 30,

            alignY:
            'middle'
        });


        styleLabel(
            iconLabel,
            COLORS.yellow,
            18,
            true
        );


        const captionLabel =
              new qx.ui.basic.Label(
                  `${caption}:`
            );


        captionLabel.set({

            width: 105,

            alignY:
            'middle'
        });


        styleLabel(
            captionLabel,
            COLORS.white,
            15,
            true
        );


        const valueLabel =
              new qx.ui.basic.Label(
                  String(value ?? '')
              );


        valueLabel.set({

            alignY:
            'middle'
        });


        styleLabel(
            valueLabel,
            COLORS.yellow,
            15,
            true
        );


        row.add(iconLabel);
        row.add(captionLabel);
        row.add(valueLabel);


        return row;
    }


    // =========================================================
    // Spieldaten
    // =========================================================

    function getGameData() {

        const mainData =
              ClientLib.Data.MainData.GetInstance();


        const player =
              mainData.get_Player();


        const server =
              mainData.get_Server();


        const alliance =
              mainData.get_Alliance();


        return {

            worldId:
            server?.get_WorldId(),

            allianceId:
            alliance?.get_Id(),

            playerId:
            player?.get_Id(),

            playerName:
            player?.get_Name?.() ||
            'unbekannt'
        };
    }


    // =========================================================
    // UV-Status
    // =========================================================

    function getSubstitutionStatus() {

        try {

            const mainData =
                  ClientLib.Data.MainData.GetInstance();


            const substitution =
                  mainData.get_PlayerSubstitution();


            const outgoing =
                  substitution?.getOutgoing();


            if (!outgoing) {

                return {

                    active:
                    false,

                    player:
                    null,

                    data:
                    null
                };
            }


            return {

                active:
                true,

                player:
                outgoing.n ||
                'unbekannt',

                data:
                outgoing
            };


        } catch (e) {

            console.error(
                `${scriptName}: Fehler beim Auslesen der UV`,
                e
            );


            return {

                active:
                false,

                player:
                null,

                data:
                null
            };
        }
    }


    // =========================================================
    // UV-Status anzeigen
    // =========================================================

    function updateStatus(
    statusLabel
    ) {

        const status =
              getSubstitutionStatus();


        if (!status.active) {

            statusLabel.setValue(
                'UV-Status: Keine ausgehende UV aktiv'
            );


            styleLabel(
                statusLabel,
                COLORS.yellow,
                15,
                true
            );


            return;
        }


        statusLabel.setValue(
            `UV-Status: Aktiv → ${status.player}`
        );


        styleLabel(
            statusLabel,
            COLORS.green,
            15,
            true
        );
    }


    // =========================================================
    // UV senden
    // =========================================================

    function sendSubstitution(
    targetPlayer,
     statusLabel,
     sendButton,
     gameData,
     enabled
    ) {

        targetPlayer =
            String(targetPlayer || '').trim();


        // -----------------------------------------------------
        // Einstellung automatisch speichern
        // -----------------------------------------------------

        saveCurrentSettings(
            gameData,
            targetPlayer,
            enabled
        );


        // -----------------------------------------------------
        // Kein Zielspieler
        // -----------------------------------------------------

        if (!targetPlayer) {

            statusLabel.setValue(
                'Fehler: Kein Zielspieler eingetragen'
            );


            styleLabel(
                statusLabel,
                COLORS.red,
                15,
                true
            );


            return;
        }


        // -----------------------------------------------------
        // Prüfen, ob bereits UV vorhanden
        // -----------------------------------------------------

        const currentSub =
              getSubstitutionStatus();


        if (currentSub.active) {

            statusLabel.setValue(
                `UV bereits aktiv → ${currentSub.player}`
            );


            styleLabel(
                statusLabel,
                COLORS.green,
                15,
                true
            );


            return;
        }


        // -----------------------------------------------------
        // Session-ID
        // -----------------------------------------------------

        let instanceId;


        try {

            instanceId =
                ClientLib.Net.CommunicationManager
                .GetInstance()
                .get_InstanceId();


        } catch (e) {

            console.error(
                `${scriptName}: InstanceId konnte nicht ermittelt werden`,
                e
            );


            statusLabel.setValue(
                'Fehler: Session-ID konnte nicht ermittelt werden'
            );


            styleLabel(
                statusLabel,
                COLORS.red,
                15,
                true
            );


            return;
        }


        const dataSub = {

            name:
            targetPlayer,

            session:
            instanceId
        };


        console.log(
            `${scriptName}: sende UV an ${targetPlayer}`,
            dataSub
        );


        statusLabel.setValue(
            `UV wird an ${targetPlayer} gesendet ...`
        );


        styleLabel(
            statusLabel,
            COLORS.yellow,
            15,
            true
        );


        if (sendButton) {

            sendButton.setEnabled(
                false
            );
        }


        // -----------------------------------------------------
        // Versand
        // -----------------------------------------------------

        ClientLib.Net.CommunicationManager
            .GetInstance()
            .SendSimpleCommand(

            'SubstitutionCreateReq',

            dataSub,

            webfrontend.phe.cnc.Util.createEventDelegate(

                ClientLib.Net.CommandResult,

                this,

                function () {

                    console.log(
                        `${scriptName}: UV gesendet an ${targetPlayer}`
                        );


                    statusLabel.setValue(
                        `UV gesendet → ${targetPlayer}`
                        );


                    styleLabel(
                        statusLabel,
                        COLORS.green,
                        15,
                        true
                    );


                    setTimeout(
                        function () {

                            if (
                                sendButton &&
                                !sendButton.isDisposed()
                            ) {

                                sendButton.setEnabled(
                                    true
                                );
                            }


                            updateStatus(
                                statusLabel
                            );

                        },
                        1500
                    );

                }
            ),

            null
        );
    }


    // =========================================================
    // UV zurückrufen
    // =========================================================

    function cancelSubstitution(
    statusLabel,
     cancelButton
    ) {

        const currentSub =
              getSubstitutionStatus();


        if (
            !currentSub.active ||
            !currentSub.data
        ) {

            statusLabel.setValue(
                'Keine ausgehende UV vorhanden'
            );


            styleLabel(
                statusLabel,
                COLORS.yellow,
                15,
                true
            );


            return;
        }


        const outgoing =
              currentSub.data;


        const subCancelId =
              outgoing.i;


        const subCancelPid =
              outgoing.p1;


        const subName =
              outgoing.n ||
              'unbekannt';


        if (
            subCancelId === undefined ||
            subCancelPid === undefined
        ) {

            statusLabel.setValue(
                'Fehler: UV-Daten unvollständig'
            );


            styleLabel(
                statusLabel,
                COLORS.red,
                15,
                true
            );


            console.error(
                `${scriptName}: Unvollständige UV-Daten`,
                outgoing
            );


            return;
        }


        let instanceId;


        try {

            instanceId =
                ClientLib.Net.CommunicationManager
                .GetInstance()
                .get_InstanceId();


        } catch (e) {

            console.error(
                `${scriptName}: InstanceId konnte nicht ermittelt werden`,
                e
            );


            statusLabel.setValue(
                'Fehler: Session-ID konnte nicht ermittelt werden'
            );


            styleLabel(
                statusLabel,
                COLORS.red,
                15,
                true
            );


            return;
        }


        const dataSubCancel = {

            id:
            subCancelId,

            pid:
            subCancelPid,

            session:
            instanceId
        };


        console.log(
            `${scriptName}: rufe UV von ${subName} zurück`,
            dataSubCancel
        );


        statusLabel.setValue(
            `UV von ${subName} wird zurückgerufen ...`
        );


        styleLabel(
            statusLabel,
            COLORS.yellow,
            15,
            true
        );


        if (cancelButton) {

            cancelButton.setEnabled(
                false
            );
        }


        ClientLib.Net.CommunicationManager
            .GetInstance()
            .SendSimpleCommand(

            'SubstitutionCancelReq',

            dataSubCancel,

            webfrontend.phe.cnc.Util.createEventDelegate(

                ClientLib.Net.CommandResult,

                this,

                function () {

                    console.log(
                        `${scriptName}: UV von ${subName} zurückgerufen`
                        );


                    statusLabel.setValue(
                        `UV zurückgerufen → ${subName}`
                        );


                    styleLabel(
                        statusLabel,
                        COLORS.green,
                        15,
                        true
                    );


                    setTimeout(
                        function () {

                            if (
                                cancelButton &&
                                !cancelButton.isDisposed()
                            ) {

                                cancelButton.setEnabled(
                                    true
                                );
                            }


                            updateStatus(
                                statusLabel
                            );

                        },
                        1500
                    );

                }
            ),

            null
        );
    }


    // =========================================================
    // AUTOMATISCHE UV-PRÜFUNG BEIM LOGIN
    // =========================================================

    function checkAutomaticSubstitution() {

        try {

            const gameData =
                  getGameData();

            // Welt oder Allianz noch nicht verfügbar
            if (
                !gameData.worldId ||
                !gameData.allianceId
            ) {
                return;
            }

            const current =
                  loadCurrentSettings(
                      gameData
                  );

            const settings =
                  current.settings;

            // Automatik ausgeschaltet
            if (!settings.enabled) {
                stopAutomaticSubstitutionMonitor();
                return;
            }

            // Kein Zielspieler
            if (!settings.targetPlayer) {
                stopAutomaticSubstitutionMonitor();
                return;
            }

            // -----------------------------------------------------
            // Prüfen, ob bereits eine UV aktiv ist
            // -----------------------------------------------------

            const currentSub =
                  getSubstitutionStatus();

            if (currentSub.active) {

                // UV ist noch aktiv.
                // Deshalb später erneut prüfen.
                return;
            }

            // -----------------------------------------------------
            // Keine UV mehr vorhanden
            // → neue UV automatisch senden
            // -----------------------------------------------------

            console.log(
                `${scriptName}: Keine aktive UV vorhanden. ` +
                `Automatische UV an ${settings.targetPlayer}`
        );

            sendSubstitutionAutomatic(
                settings.targetPlayer
            );

            // Die automatische Überwachung kann beendet werden.
            stopAutomaticSubstitutionMonitor();

        } catch (e) {

            console.error(
                `${scriptName}: Fehler bei der Automatikprüfung`,
                e
            );
        }
    }

    function startAutomaticSubstitutionMonitor() {

        // Falls bereits eine Prüfung läuft,
        // keine zweite starten.
        if (automaticCheckTimer) {
            return;
        }

        console.log(
            `${scriptName}: Automatische UV-Überwachung gestartet`
    );

        automaticCheckTimer =
            setInterval(
            function () {

                checkAutomaticSubstitution();

            },
            5000
        );

        // Sofort einmal prüfen
        checkAutomaticSubstitution();
    }


    function stopAutomaticSubstitutionMonitor() {

        if (automaticCheckTimer) {

            clearInterval(
                automaticCheckTimer
            );

            automaticCheckTimer = null;

            console.log(
                `${scriptName}: Automatische UV-Überwachung beendet`
        );
    }
}

    // =========================================================
    // Automatischer Versand
    // =========================================================

    function sendSubstitutionAutomatic(
    targetPlayer
    ) {

        targetPlayer =
            String(targetPlayer || '').trim();


        if (!targetPlayer) {

            console.log(
                `${scriptName}: Kein Zielspieler für Automatik`
            );


            return;
        }


        // -----------------------------------------------------
        // Sicherheitshalber noch einmal prüfen
        // -----------------------------------------------------

        const currentSub =
              getSubstitutionStatus();


        if (currentSub.active) {

            console.log(
                `${scriptName}: UV inzwischen vorhanden → ` +
                `${currentSub.player}`
            );


                return;
            }


        let instanceId;


        try {

            instanceId =
                ClientLib.Net.CommunicationManager
                .GetInstance()
                .get_InstanceId();


        } catch (e) {

            console.error(
                `${scriptName}: InstanceId konnte für Automatik ` +
                `nicht ermittelt werden`,
                e
            );


            return;
        }


        const dataSub = {

            name:
            targetPlayer,

            session:
            instanceId
        };


        console.log(
            `${scriptName}: AUTOMATIK → sende UV an ${targetPlayer}`,
            dataSub
        );


        ClientLib.Net.CommunicationManager
            .GetInstance()
            .SendSimpleCommand(

            'SubstitutionCreateReq',

            dataSub,

            webfrontend.phe.cnc.Util.createEventDelegate(

                ClientLib.Net.CommandResult,

                this,

                function () {

                    console.log(
                        `${scriptName}: AUTOMATIK → UV gesendet an ` +
                        `${targetPlayer}`
                        );

                }
            ),

            null
        );
    }


    // =========================================================
    // Fenster öffnen
    // =========================================================

    function openWindow() {

        if (subSenderWindow) {

            subSenderWindow.open();
            subSenderWindow.activate();
            subSenderWindow.bringToFront();

            return;
        }


        const gameData =
              getGameData();


        const current =
              loadCurrentSettings(
                  gameData
              );


        const settings =
              current.settings;


        // =====================================================
        // Fenster
        // =====================================================

        subSenderWindow =
            new qx.ui.window.Window(
            scriptName
        );


        subSenderWindow.set({

            // Bild 2 / schmalere Variante
            width:
            390,

            height:
            400,

            allowMaximize:
            false,

            allowMinimize:
            true,

            showMaximize:
            false,

            showMinimize:
            true,

            showClose:
            true
        });


        subSenderWindow.setLayout(
            new qx.ui.layout.VBox(10)
        );


        // =====================================================
        // SPIELINFORMATIONEN
        // =====================================================

        const infoGroup =
              new qx.ui.groupbox.GroupBox(
                  'Aktuelle Spielinformationen'
              );


        infoGroup.setLayout(
            new qx.ui.layout.VBox(5)
        );


        const infoPanel =
              new qx.ui.container.Composite(
                  new qx.ui.layout.VBox(4)
              );


        infoPanel.set({

            padding:
            8,

            backgroundColor:
            '#20262A',

            opacity:
            0.94
        });


        infoPanel.add(
            createInfoRow(
                '🌍',
                'Welt',
                gameData.worldId
            )
        );


        infoPanel.add(
            createInfoRow(
                '🛡',
                'Allianz-ID',
                gameData.allianceId
            )
        );


        infoPanel.add(
            createInfoRow(
                '👤',
                'Spieler',
                gameData.playerName
            )
        );


        infoPanel.add(
            createInfoRow(
                '🪪',
                'Spieler-ID',
                gameData.playerId
            )
        );


        infoGroup.add(
            infoPanel
        );


        subSenderWindow.add(
            infoGroup
        );


        // =====================================================
        // UV-EINSTELLUNGEN
        // =====================================================

        const targetGroup =
              new qx.ui.groupbox.GroupBox(
                  'UV-Einstellungen'
              );


        targetGroup.setLayout(
            new qx.ui.layout.VBox(6)
        );


        const targetLabel =
              new qx.ui.basic.Label(
                  'UV senden an:'
              );


        styleLabel(
            targetLabel,
            COLORS.white,
            15,
            true
        );


        const targetField =
              new qx.ui.form.TextField(
                  settings.targetPlayer || ''
              );


        targetField.set({
            width:
            280
        });


        targetField.setTextColor(
            COLORS.white
        );


        targetField.setFont(
            new qx.bom.Font(15).set({
                bold:
                true
            })
        );


        targetGroup.add(
            targetLabel
        );


        targetGroup.add(
            targetField
        );


        subSenderWindow.add(
            targetGroup
        );


        // =====================================================
        // UV-STATUS
        // =====================================================

        const statusGroup =
              new qx.ui.groupbox.GroupBox(
                  'UV-Status'
              );


        statusGroup.setLayout(
            new qx.ui.layout.VBox(5)
        );


        const statusLabel =
              new qx.ui.basic.Label();


        updateStatus(
            statusLabel
        );


        statusGroup.add(
            statusLabel
        );


        subSenderWindow.add(
            statusGroup
        );


        // =====================================================
        // AUTOMATIK
        // =====================================================

        const enabledCheckBox =
              new qx.ui.form.CheckBox(
                  'Automatische UV-Verwaltung aktiv'
              );


        enabledCheckBox.setValue(
            !!settings.enabled
        );


        enabledCheckBox.setTextColor(
            COLORS.white
        );


        enabledCheckBox.setFont(
            new qx.bom.Font(14).set({
                bold:
                true
            })
        );


        subSenderWindow.add(
            enabledCheckBox
        );


        // =====================================================
        // BUTTONS
        // =====================================================

        const buttonRow1 =
              new qx.ui.container.Composite(
                  new qx.ui.layout.HBox(10)
              );


        const buttonRow2 =
              new qx.ui.container.Composite(
                  new qx.ui.layout.HBox(10)
              );


        // -----------------------------------------------------
        // UV senden
        // -----------------------------------------------------

        const sendButton =
              new qx.ui.form.Button(
                  'UV jetzt senden'
              );

        sendButton.set({
            width:
            170
        });

        sendButton.setTextColor(
            COLORS.yellow
        );


        sendButton.setFont(
            new qx.bom.Font(14).set({
                bold:
                true
            })
        );


        // -----------------------------------------------------
        // UV zurückrufen
        // -----------------------------------------------------

        const cancelButton =
              new qx.ui.form.Button(
                  'UV zurückrufen'
              );

        cancelButton.set({
            width:
            170
        });

        cancelButton.setTextColor(
            COLORS.red
        );

        cancelButton.setFont(
            new qx.bom.Font(14).set({
                bold:
                true
            })
        );


        // -----------------------------------------------------
        // Status aktualisieren
        // -----------------------------------------------------

        const refreshButton =
              new qx.ui.form.Button(
                  'Status aktualisieren'
              );

        refreshButton.set({
            width:
            350
        });

        refreshButton.setTextColor(
            COLORS.yellow
        );

        refreshButton.setFont(
            new qx.bom.Font(14).set({
                bold:
                true
            })
        );


        // =====================================================
        // AUTOMATISCHES SPEICHERN
        // =====================================================

        // Zielspieler geändert
        targetField.addListener(
            'changeValue',
            function () {

                saveCurrentSettings(

                    gameData,

                    targetField.getValue(),

                    enabledCheckBox.getValue()
                );

            }
        );


        // Checkbox geändert
        enabledCheckBox.addListener(
            'changeValue',
            function () {

                saveCurrentSettings(

                    gameData,

                    targetField.getValue(),

                    enabledCheckBox.getValue()
                );

            }
        );


        // =====================================================
        // BUTTON-AKTIONEN
        // =====================================================

        sendButton.addListener(
            'execute',
            function () {

                sendSubstitution(

                    targetField.getValue(),

                    statusLabel,

                    sendButton,

                    gameData,

                    enabledCheckBox.getValue()
                );

            }
        );


        cancelButton.addListener(
            'execute',
            function () {

                cancelSubstitution(

                    statusLabel,

                    cancelButton
                );

            }
        );


        refreshButton.addListener(
            'execute',
            function () {

                updateStatus(
                    statusLabel
                );

            }
        );


        // =====================================================
        // BUTTONS INS FENSTER
        // =====================================================

        buttonRow1.add(
            sendButton
        );


        buttonRow1.add(
            cancelButton
        );


        buttonRow2.add(
            refreshButton
        );


        subSenderWindow.add(
            buttonRow1
        );


        subSenderWindow.add(
            buttonRow2
        );


        // =====================================================
        // FENSTER SCHLIESSEN
        // =====================================================

        subSenderWindow.addListener(
            'close',
            function () {

                subSenderWindow =
                    null;

            }
        );


        // =====================================================
        // FENSTER ÖFFNEN
        // =====================================================

        qxApp.getRoot().add(
            subSenderWindow
        );


        subSenderWindow.open();


        subSenderWindow.center();

    }


    // =========================================================
    // SCRIPTE-MENÜ
    // =========================================================

    const Icons = {
        SubSender: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAADI0lEQVR42iXRy2tcVQDA4d8598y9k8mdMJNJGpvaJmlImDQxRnzgStwoQheCa0ERwUXVbsRlN+4lRRcupCBUEBQRQ2tQSAUlJBq1ITRpodrENDMNk8nMZB73de45Lvz+hU8opex771/m3NlR2t2YfN5HCIlSCiklQgisMUiTorWm0wvI9Xvs7u1zdXERcenSu7YTJlxffoDpyyL6PMhkwJGgJAKBTS1GC0g0hD1Uu80br5bxFEjXzfDFrQqp5wEGYzxs6mK1h9D9WO2TMx4fZI95020y7XTQmQzXlu6T9bKoeisgky+StCowMInIDmKlDwPnSKULVpFEFd7a+pqRWpPFoQk+KszhmgytboIS0gEhwSsi3CImN8n41DTDuQ6ny2V0bpD25jp/3S/x7dOvsF5PwFEYaUlTjUqSBIuDUFlwR5maW6Dw54fs/LZCPHme727+QGfMZeOriItX3mZ4V/LZ1c8hC8YYpMWCcrCiH1OYodBeZXt9Ba/4OP9UGnz86TUODpvEUchZV/P68yVKY+fRBlJjUAIw1mH8dJ4r75R4pvwa6eUXGT41ws0bN1haXmYlCDiTGpZ+vEVhaJhc/wB1oTCpRqY6waSGwkCWJ4fadGr7zMxc4Lhep/roEdPT0+zv/8tPvk/1sErt8JAoMeBItNaoOI5BulSOQ0bG51hbW2X7y+sIIfB9n9ZJG+P73MHhOSEJo4hUh2AMSaJRcZIgjabT6bF5e4NnFy5w0otpNpusr//O3u4DTj02ygsvvYxIY3R4AoGGJCaKkv8XHKvptWp88s0fjPqrNCt30XFM5eEeYxOThEGP1kmHHnka3ZReq4ZjUsIwRoVRQhpGiPiI5bUDkH04+TLFYpH+CZfw4Hsav/5Mo2+W3pmLUN+BdhUpC4RhhPI9QZ81dLsJxLchWyINshwdOhwJj1xQZaI0TL3RgIe/QFiF2CE36JLNBIjZuXk7VZ5j42+FVgrhuQjlIJQEIXEVZCR02wFpKrFBQMYanhqPube9iQDsE/MLzM/PYq2DdCRSCBASR0qElKTGgjUkSUwURQhStrbucO/uDv8BRSmC47x2E2oAAAAASUVORK5CYII='
    };

    function addScriptsMenuEntry() {

        const scriptsButton =
              qxApp.getMenuBar().getScriptsButton();

        const menu =
              scriptsButton.getMenu();

        const existingItem =
              menu
        .getChildren()
        .find(
            item =>
            item.getLabel() === scriptName
        );

        if (existingItem) {

            existingItem.addListener(
                'execute',
                openWindow
            );

            return;
        }

        const menuItem =
              new qx.ui.menu.Button(
                  scriptName,
                  Icons.SubSender
              );

        menuItem.addListener(
            'execute',
            openWindow
        );

        menu.add(
            menuItem
        );

        console.log(
            `%c${scriptName}: Menüeintrag hinzugefügt`,
            'color: green; font-weight:bold;'
        );
    }


    // =========================================================
    // AUF SPIEL WARTEN
    // =========================================================

    function waitForGame() {

        try {

            if (
                typeof qx === 'undefined' ||
                typeof ClientLib === 'undefined' ||
                !qx?.core?.Init?.getApplication
            ) {

                setTimeout(
                    waitForGame,
                    1000
                );


                return;
            }


            qxApp =
                qx.core.Init.getApplication();


            if (
                !qxApp ||
                !qxApp.initDone ||
                !qxApp.getMenuBar() ||
                !qxApp.getMenuBar().getScriptsButton()
            ) {

                setTimeout(
                    waitForGame,
                    1000
                );


                return;
            }


            initialize();


        } catch (e) {

            console.error(
                `${scriptName}: Initialisierungsfehler`,
                e
            );


            setTimeout(
                waitForGame,
                1000
            );
        }
    }


    // =========================================================
    // INITIALISIERUNG
    // =========================================================

    function initialize() {

        addScriptsMenuEntry();


        const gameData =
              getGameData();


        console.log(
            `%c${scriptName} gestartet`,
            'color: green; font-weight:bold;'
        );


        console.log(
            `${scriptName}: Welt ${gameData.worldId}, ` +
            `Allianz ${gameData.allianceId}, ` +
            `Spieler ${gameData.playerName}`
        );


        // -----------------------------------------------------
        // EINZIGE AUTOMATISCHE PRÜFUNG BEIM LOGIN
        // -----------------------------------------------------

        startAutomaticSubstitutionMonitor();

    }


    // =========================================================
    // START
    // =========================================================

    waitForGame();

})();
