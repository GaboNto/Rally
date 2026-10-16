Add-Type -AssemblyName System.Drawing

$assetsDirectory = Join-Path $PSScriptRoot '..\public\assets'
New-Item -ItemType Directory -Path $assetsDirectory -Force | Out-Null

function New-TopographicMap {
  param(
    [string]$OutputPath,
    [bool]$RiskPalette
  )

  $width = 2200
  $height = 1800
  $bitmap = [System.Drawing.Bitmap]::new($width, $height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $terrainBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    [System.Drawing.Point]::new(760, 0),
    [System.Drawing.Point]::new(1350, 0),
    [System.Drawing.Color]::Black,
    [System.Drawing.Color]::White
  )
  $blend = [System.Drawing.Drawing2D.ColorBlend]::new()
  $blend.Positions = [single[]](0, 0.18, 0.38, 0.60, 0.80, 1)
  if ($RiskPalette) {
    $leftColor = [System.Drawing.Color]::FromArgb(158, 222, 52, 65)
    $rightColor = [System.Drawing.Color]::FromArgb(158, 31, 158, 103)
    $blend.Colors = [System.Drawing.Color[]]@(
      [System.Drawing.Color]::FromArgb(158, 222, 52, 65),
      [System.Drawing.Color]::FromArgb(158, 239, 104, 54),
      [System.Drawing.Color]::FromArgb(158, 245, 183, 61),
      [System.Drawing.Color]::FromArgb(158, 221, 225, 67),
      [System.Drawing.Color]::FromArgb(158, 112, 203, 91),
      [System.Drawing.Color]::FromArgb(158, 31, 158, 103)
    )
  } else {
    $leftColor = [System.Drawing.Color]::FromArgb(158, 42, 184, 211)
    $rightColor = [System.Drawing.Color]::FromArgb(158, 202, 50, 64)
    $blend.Colors = [System.Drawing.Color[]]@(
      [System.Drawing.Color]::FromArgb(158, 42, 184, 211),
      [System.Drawing.Color]::FromArgb(158, 54, 207, 154),
      [System.Drawing.Color]::FromArgb(158, 174, 220, 65),
      [System.Drawing.Color]::FromArgb(158, 245, 217, 59),
      [System.Drawing.Color]::FromArgb(158, 239, 125, 50),
      [System.Drawing.Color]::FromArgb(158, 202, 50, 64)
    )
  }
  $terrainBrush.InterpolationColors = $blend
  $leftBrush = [System.Drawing.SolidBrush]::new($leftColor)
  $rightBrush = [System.Drawing.SolidBrush]::new($rightColor)
  $graphics.FillRectangle($leftBrush, 0, 0, 760, $height)
  $graphics.FillRectangle($terrainBrush, 760, 0, 590, $height)
  $graphics.FillRectangle($rightBrush, 1350, 0, $width - 1350, $height)

  $hillBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(24, 255, 255, 255))
  $graphics.FillEllipse($hillBrush, 1030, -160, 850, 720)
  $graphics.FillEllipse($hillBrush, 950, 1120, 920, 760)
  $valleyBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(20, 18, 55, 51))
  $graphics.FillEllipse($valleyBrush, 920, 680, 1050, 420)

  $contourPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(80, 49, 75, 66), 3)
  for ($index = 0; $index -lt 8; $index++) {
    $x = 930 + $index * 155
    $contour = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $contour.AddBezier($x, -40, $x - 80, 360, $x + 95, 650, $x + 5, 940)
    $contour.AddBezier($x + 5, 940, $x - 70, 1210, $x + 100, 1470, $x + 20, 1840)
    $graphics.DrawPath($contourPen, $contour)
    $contour.Dispose()
  }

  $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $contourPen.Dispose()
  $valleyBrush.Dispose(); $hillBrush.Dispose(); $leftBrush.Dispose(); $rightBrush.Dispose(); $terrainBrush.Dispose()
  $graphics.Dispose(); $bitmap.Dispose()
}

New-TopographicMap -OutputPath (Join-Path $assetsDirectory 'arica-topografia-riesgo.png') -RiskPalette $true
New-TopographicMap -OutputPath (Join-Path $assetsDirectory 'arica-topografia-altitud.png') -RiskPalette $false
