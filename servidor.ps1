# Servidor estatico minimo en PowerShell puro.
# Existe para que el atril funcione en un ordenador sin Python ni Node:
# PowerShell viene en todo Windows. Escucha solo en 127.0.0.1.
param([int]$Puerto = 8756)

$raiz = Split-Path -Parent $MyInvocation.MyCommand.Path

$tipos = @{
  ".html" = "text/html; charset=utf-8"
  ".txt"  = "text/plain; charset=utf-8"
  ".md"   = "text/plain; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".svg"  = "image/svg+xml"
  ".png"  = "image/png"
  ".jpg"  = "image/jpeg"
  ".ico"  = "image/x-icon"
  ".woff2" = "font/woff2"
}

# Busca un puerto libre a partir del pedido.
$oyente = $null
for ($p = $Puerto; $p -lt ($Puerto + 20); $p++) {
  try {
    $l = New-Object System.Net.HttpListener
    $l.Prefixes.Add("http://localhost:$p/")
    $l.Start()
    $oyente = $l
    $Puerto = $p
    break
  } catch {
    if ($l) { try { $l.Close() } catch {} }
  }
}

if (-not $oyente) {
  Write-Output ""
  Write-Output "  No se pudo abrir ningun puerto entre $Puerto y $($Puerto+19)."
  Write-Output "  Cierra otros servidores y vuelve a intentarlo."
  Write-Output ""
  Read-Host "  Pulsa Enter para salir"
  exit 1
}

$url = "http://localhost:$Puerto/"
Write-Output ""
Write-Output "    ATRIL DE LOCUCION"
Write-Output "    ---------------------------------------------"
Write-Output "    Abierto en:  $url"
Write-Output ""
Write-Output "    Deja esta ventana abierta mientras grabas."
Write-Output "    Para cerrar el atril, cierra esta ventana."
Write-Output "    ---------------------------------------------"
Write-Output ""

Start-Process $url

while ($oyente.IsListening) {
  try {
    $ctx = $oyente.GetContext()
  } catch {
    break
  }
  $ruta = $ctx.Request.Url.LocalPath
  if ($ruta -eq "/") { $ruta = "/index.html" }

  # Solo se sirve lo que cuelga de esta carpeta.
  $destino = Join-Path $raiz ($ruta.TrimStart("/") -replace "/", "\")
  $completa = [System.IO.Path]::GetFullPath($destino)

  if ((-not $completa.StartsWith($raiz)) -or (-not (Test-Path $completa -PathType Leaf))) {
    $ctx.Response.StatusCode = 404
    $ctx.Response.Close()
    continue
  }

  $ext = [System.IO.Path]::GetExtension($completa).ToLower()
  $tipo = $tipos[$ext]
  if (-not $tipo) { $tipo = "application/octet-stream" }

  $bytes = [System.IO.File]::ReadAllBytes($completa)
  $ctx.Response.ContentType = $tipo
  $ctx.Response.ContentLength64 = $bytes.Length
  $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $ctx.Response.Close()
}
