# Homepage name font

`dazhi-name-kai.woff2` contains only 赵、大、志 for the Chinese name in the homepage heading. CSS uses the family alias `Dazhi Name Kai`. The font is LXGW WenKai Regular (weight 400), licensed under SIL OFL 1.1; the license text is in `OFL.txt`.

Source: [LXGW WenKai](https://github.com/lxgw/LxgwWenKai), commit `8bd6319350fb3ae1904c1cb1a41595ab15d21140`, file `fonts/TTF/LXGWWenKai-Regular.ttf`.

- Source SHA-256: `39ad71264b588165b469e35e6afb162a378dacd1f95348160240ba9038ac3009`
- Subset SHA-256: `4afdb348b14c4619ba458a10a31eaa0adfa67b8f775e0aeebb15202795910401`
- Subset size: 1,372 bytes.

To regenerate, use a temporary Python environment with `fonttools==4.65.0` and `brotli==1.2.0`, download the pinned source font, then run:

```sh
pyftsubset LXGWWenKai-Regular.ttf --text='赵大志' --flavor=woff2 --no-recalc-timestamp --output-file=dazhi-name-kai.woff2
```

Only the subset, this source record, and the license are part of the site. Jekyll and the browser do not need the font preparation tools.
