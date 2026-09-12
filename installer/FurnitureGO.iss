#define MyAppName "Furniture GO"
#define MyAppVersion "1.0.0"
#define MyAppExeName "FurnitureGO-Launcher.ps1"

[Setup]
AppId={{B6BEBE3B-AD7A-4A8F-9DF5-8C6D2A9E9E10}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
DefaultDirName={autopf}\Furniture GO
DefaultGroupName={#MyAppName}
OutputDir=..\release\installer
OutputBaseFilename=Furniture-GO-1.0.0-Setup
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64compatible
Uninstallable=yes
ChangesAssociations=no
DisableProgramGroupPage=yes

[Files]
Source: "staging\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Furniture GO"; Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""{app}\FurnitureGO-Launcher.ps1"""; WorkingDir: "{app}"
Name: "{commondesktop}\Furniture GO"; Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""{app}\FurnitureGO-Launcher.ps1"""; WorkingDir: "{app}"

[UninstallDelete]
Type: filesandordirs; Name: "{app}"
