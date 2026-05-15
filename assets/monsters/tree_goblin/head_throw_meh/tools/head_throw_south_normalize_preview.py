from pathlib import Path
from PIL import Image, ImageChops


ROOT = Path(__file__).resolve().parents[4]
ANIM = ROOT / "monsters" / "tree_goblin" / "head_throw"
RAW = ANIM / "raw"
FRAMES = ANIM / "frames"
PREVIEW = ANIM / "preview"
GIF = ANIM / "gif"

JOB_ID = "head_throw_south"
FRAME_COUNT = 6
FRAME_W = 384
FRAME_H = 384
ANCHOR_X = 192
ANCHOR_Y = 376
KEY = (255, 0, 255)


def key_to_alpha(img):
    img = img.convert("RGBA")
    pixels = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = pixels[x, y]
            if is_magenta_key(r, g, b):
                pixels[x, y] = (255, 0, 255, 0)
    return img


def is_magenta_key(r, g, b):
    return r >= 185 and b >= 185 and g <= 80 and abs(r - b) <= 75


def scrub_magenta_alpha(img):
    img = img.convert("RGBA")
    pixels = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = pixels[x, y]
            if a and is_magenta_key(r, g, b):
                pixels[x, y] = (255, 0, 255, 0)
    return img


def rgba_to_transparent_gif_frame(img):
    alpha = img.getchannel("A")
    paletted = img.convert("RGB").quantize(colors=255, method=Image.Quantize.MEDIANCUT)
    transparent_mask = alpha.point(lambda value: 255 if value == 0 else 0)
    paletted.paste(255, mask=transparent_mask)
    palette = paletted.getpalette()
    palette.extend([0] * (768 - len(palette)))
    palette[765:768] = [255, 0, 255]
    paletted.putpalette(palette)
    paletted.info["transparency"] = 255
    return paletted


def bbox_for(img):
    alpha = img.getchannel("A")
    return alpha.getbbox()


def main():
    FRAMES.mkdir(parents=True, exist_ok=True)
    PREVIEW.mkdir(parents=True, exist_ok=True)
    GIF.mkdir(parents=True, exist_ok=True)

    keyed = []
    boxes = []
    for index in range(1, FRAME_COUNT + 1):
        src = RAW / f"{JOB_ID}_frame_{index:02d}_raw.png"
        img = key_to_alpha(Image.open(src))
        box = bbox_for(img)
        if box is None:
            raise RuntimeError(f"No visible pixels in {src}")
        keyed.append(img)
        boxes.append(box)

    max_w = max(box[2] - box[0] for box in boxes)
    max_h = max(box[3] - box[1] for box in boxes)
    scale = min((FRAME_W - 24) / max_w, (ANCHOR_Y - 8) / max_h, 1.0)

    normalized = []
    for index, (img, box) in enumerate(zip(keyed, boxes), start=1):
        crop = img.crop(box)
        if scale != 1.0:
            new_size = (max(1, round(crop.width * scale)), max(1, round(crop.height * scale)))
            crop = crop.resize(new_size, Image.Resampling.LANCZOS)
            crop = scrub_magenta_alpha(crop)
        canvas = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
        x = ANCHOR_X - crop.width // 2
        y = ANCHOR_Y - crop.height
        canvas.alpha_composite(crop, (x, y))
        out = FRAMES / f"{JOB_ID}_{index:02d}.png"
        canvas.save(out)
        normalized.append(canvas)

    sheet = Image.new("RGBA", (FRAME_W * FRAME_COUNT, FRAME_H), (0, 0, 0, 0))
    for index, img in enumerate(normalized):
        sheet.alpha_composite(img, (index * FRAME_W, 0))
    sheet.save(PREVIEW / f"{JOB_ID}_preview.png")

    enlarged = sheet.resize((sheet.width * 2, sheet.height * 2), Image.Resampling.NEAREST)
    enlarged.save(PREVIEW / f"{JOB_ID}_preview_2x.png")

    gif_frames = [rgba_to_transparent_gif_frame(img) for img in normalized]
    gif_frames[0].save(
        GIF / f"{JOB_ID}.gif",
        save_all=True,
        append_images=gif_frames[1:],
        duration=120,
        loop=0,
        disposal=2,
        transparency=255,
    )


if __name__ == "__main__":
    main()
