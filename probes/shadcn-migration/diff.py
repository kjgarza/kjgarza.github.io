# Probe 2b: pixel diff baseline vs candidate screenshots; writes red-highlight diff images
import sys, os
from PIL import Image, ImageChops
a, b, out = sys.argv[1:4]; os.makedirs(out, exist_ok=True)
for f in sorted(os.listdir(a)):
    x, y = Image.open(os.path.join(a, f)).convert('RGB'), Image.open(os.path.join(b, f)).convert('RGB')
    h = max(x.height, y.height); w = x.width
    X, Y = Image.new('RGB', (w, h), 'white'), Image.new('RGB', (w, h), 'white'); X.paste(x); Y.paste(y)
    d = ImageChops.difference(X, Y).convert('L').point(lambda v: 255 if v > 16 else 0)
    n = sum(d.histogram()[255:]); pct = 100 * n / (w * h)
    print(f"{f:50s} {x.height:>5}->{y.height:<5} {pct:6.2f}% px differ")
    if n: Image.composite(Image.new('RGB', (w, h), 'red'), Y.point(lambda v: v // 2 + 127), d).save(os.path.join(out, f))
