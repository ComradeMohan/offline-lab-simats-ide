!macro customInstall
  DetailPrint "Configuring SIMATS Lab IDE shortcuts..."
  CreateShortCut "$DESKTOP\SIMATS Lab IDE.lnk" "$INSTDIR\SIMATS Lab IDE.exe" "" "$INSTDIR\assets\icon.ico"
!macroend
