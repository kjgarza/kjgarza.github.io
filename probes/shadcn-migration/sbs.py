# side-by-side baseline | candidate | diff, cropped to the first rows that differ
import sys
from PIL import Image
a, b, d, out, top, hgt = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], int(sys.argv[5]), int(sys.argv[6])
ims = [Image.open(p).convert('RGB') for p in (a, b, d)]
w = ims[0].width; c = Image.new('RGB', (w * 3 + 20, hgt), 'black')
for i, im in enumerate(ims): c.paste(im.crop((0, top, w, top + hgt)), (i * (w + 10), 0))
c.thumbnail((1600, 1600)); c.save(out)
