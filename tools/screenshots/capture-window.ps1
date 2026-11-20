param(
  [Parameter(Mandatory)][string]$Name,
  [Parameter(Mandatory)][long]$Handle,
  [string]$OutDir = (Join-Path $PSScriptRoot 'captures')
)
# Captures one window by handle with PrintWindow (works for Compose/DirectX
# windows), so nothing else on screen ends up in the picture.
New-Item -ItemType Directory -Force $OutDir | Out-Null
Add-Type -AssemblyName System.Drawing
if (-not ('CapWin' -as [type])) {
Add-Type @'
using System; using System.Runtime.InteropServices;
public static class CapWin {
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr hdc, uint f);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  public struct RECT { public int L, T, R, B; }
}
'@
}
$h = [IntPtr]$Handle
$r = New-Object CapWin+RECT; [CapWin]::GetWindowRect($h, [ref]$r) | Out-Null
$bmp = New-Object System.Drawing.Bitmap ($r.R - $r.L), ($r.B - $r.T)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$hdc = $g.GetHdc(); [CapWin]::PrintWindow($h, $hdc, 2) | Out-Null; $g.ReleaseHdc($hdc); $g.Dispose()
$bmp.Save((Join-Path $OutDir "$Name.png"), [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
"saved $Name.png ($($r.R - $r.L)x$($r.B - $r.T))"
