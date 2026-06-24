$ErrorActionPreference = "Stop"
Set-Location -LiteralPath "C:\Users\Usuario\Desktop\BON DESTI NEXT"
$env:Path = "C:\Program Files\nodejs;C:\Windows\System32;C:\Windows"
& "C:\Program Files\nodejs\node.exe" "node_modules\next\dist\bin\next" dev --webpack
