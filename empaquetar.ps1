# Genera el zip que se le pasa a un cliente.
# Deja fuera el guion propio y los scripts de mantenimiento: el cliente recibe
# la herramienta limpia, con su texto de ejemplo.
$origen = Split-Path -Parent $MyInvocation.MyCommand.Path
$destino = Join-Path $origen "atril-de-locucion.zip"
$temporal = Join-Path $env:TEMP ("atril-" + [guid]::NewGuid().ToString("N").Substring(0, 8))

# README.md viaja dentro para que el cliente tenga las instrucciones sin
# depender de GitHub.
$incluir = @("index.html", "servidor.ps1", "abrir-atril.cmd", "README.md")

New-Item -ItemType Directory -Path $temporal -Force | Out-Null
foreach ($f in $incluir) {
  $ruta = Join-Path $origen $f
  if (-not (Test-Path $ruta)) {
    Write-Output "  FALTA: $f"
    continue
  }
  Copy-Item $ruta -Destination $temporal
}

if (Test-Path $destino) { Remove-Item $destino -Force }
Compress-Archive -Path (Join-Path $temporal "*") -DestinationPath $destino
Remove-Item $temporal -Recurse -Force

$kb = [math]::Round((Get-Item $destino).Length / 1KB, 1)
Write-Output ""
Write-Output "  Listo: $destino  ($kb KB)"
Write-Output ""
Write-Output "  Contiene:"
foreach ($f in $incluir) { Write-Output "    - $f" }
Write-Output ""
Write-Output "  El cliente lo descomprime donde quiera y hace doble clic"
Write-Output "  en abrir-atril.cmd. No necesita instalar nada."
Write-Output ""
