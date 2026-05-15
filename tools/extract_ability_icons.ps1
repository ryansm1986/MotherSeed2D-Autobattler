Add-Type -AssemblyName System.Drawing

$sourcePath = Join-Path $PSScriptRoot "..\assets\ui\ability_icons\ability_icon_sheet.png"
$outputDir = Join-Path $PSScriptRoot "..\assets\ui\ability_icons\extracted"
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$names = @(
  "r1c1-sprout", "r1c2-leaf-whirl", "r1c3-claw", "r1c4-bloom",
  "r2c1-haste-swirl", "r2c2-tree", "r2c3-leaf-ward", "r2c4-starburst",
  "r3c1-water-drop", "r3c2-leaf-burst", "r3c3-sunburst", "r3c4-grass-blade",
  "r4c1-shield", "r4c2-twin-leaves", "r4c3-sword", "r4c4-staff"
)

function Test-MagentaPixel($pixel) {
  if ($pixel.R -gt ($pixel.G + 22) -and $pixel.B -gt ($pixel.G + 22) -and ($pixel.R + $pixel.B) -gt 100) {
    return $true
  }

  if ($pixel.R -gt 150 -and $pixel.B -gt 130 -and $pixel.G -lt 130) {
    $pinkBias = (($pixel.R + $pixel.B) / 2) - $pixel.G
    return $pinkBias -gt 48
  }

  return $false
}

$bitmap = [System.Drawing.Bitmap]::FromFile($sourcePath)

try {
  for ($row = 0; $row -lt 4; $row++) {
    for ($col = 0; $col -lt 4; $col++) {
      $x0 = [int][math]::Floor($col * $bitmap.Width / 4)
      $x1 = [int][math]::Ceiling(($col + 1) * $bitmap.Width / 4)
      $y0 = [int][math]::Floor($row * $bitmap.Height / 4)
      $y1 = [int][math]::Ceiling(($row + 1) * $bitmap.Height / 4)
      $minX = $x1
      $minY = $y1
      $maxX = $x0
      $maxY = $y0

      for ($y = $y0; $y -lt $y1; $y++) {
        for ($x = $x0; $x -lt $x1; $x++) {
          $pixel = $bitmap.GetPixel($x, $y)
          if (-not (Test-MagentaPixel $pixel)) {
            if ($x -lt $minX) { $minX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -gt $maxY) { $maxY = $y }
          }
        }
      }

      $pad = 8
      $minX = [math]::Max($x0, $minX - $pad)
      $minY = [math]::Max($y0, $minY - $pad)
      $maxX = [math]::Min($x1 - 1, $maxX + $pad)
      $maxY = [math]::Min($y1 - 1, $maxY + $pad)
      $width = $maxX - $minX + 1
      $height = $maxY - $minY + 1
      $size = [math]::Max($width, $height)
      $canvas = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
      $graphics = [System.Drawing.Graphics]::FromImage($canvas)

      try {
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $offsetX = [int][math]::Floor(($size - $width) / 2)
        $offsetY = [int][math]::Floor(($size - $height) / 2)

        for ($yy = 0; $yy -lt $height; $yy++) {
          for ($xx = 0; $xx -lt $width; $xx++) {
            $pixel = $bitmap.GetPixel($minX + $xx, $minY + $yy)
            if (-not (Test-MagentaPixel $pixel)) {
              $canvas.SetPixel(
                $offsetX + $xx,
                $offsetY + $yy,
                [System.Drawing.Color]::FromArgb($pixel.A, $pixel.R, $pixel.G, $pixel.B)
              )
            }
          }
        }

        $trim = 14
        for ($edge = 0; $edge -lt $trim; $edge++) {
          for ($i = 0; $i -lt $size; $i++) {
            $canvas.SetPixel($edge, $i, [System.Drawing.Color]::Transparent)
            $canvas.SetPixel($size - 1 - $edge, $i, [System.Drawing.Color]::Transparent)
            $canvas.SetPixel($i, $edge, [System.Drawing.Color]::Transparent)
            $canvas.SetPixel($i, $size - 1 - $edge, [System.Drawing.Color]::Transparent)
          }
        }

        $name = $names[$row * 4 + $col]
        $canvas.Save((Join-Path $outputDir "$name.png"), [System.Drawing.Imaging.ImageFormat]::Png)
      } finally {
        $graphics.Dispose()
        $canvas.Dispose()
      }
    }
  }
} finally {
  $bitmap.Dispose()
}
