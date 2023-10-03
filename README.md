invert only the images (not text nor background)<br>
[R,G,B]:255-[R,G,B]

`node invert-pdf.mjs yourPDF.pdf`<br>

included demo:<br>
`node invert-pdf.mjs VyacheslavEgorov_BenchmarkingJavaScript.pdf`<br>


output folder `tempWork\`:<br>
stage 1: decrypted.pdf<br>
stage 2: uncompressed.pdf<br>
stage 3: transformed.pdf<br>
stage 4: fixed.pdf<br>
stage 5: compressed.pdf<br>
(compressed.pdf is what you should take, the rest is for those interested)

summary:
```js
const ok=spawn(`${__dirname}/qpdf`,[pdfName,"--decrypt",`${__dirname}/tempWork/decrypted.pdf`])
const ok=spawn(`${__dirname}/pdftk`,[`${__dirname}/tempWork/decrypted.pdf`,"output",`${__dirname}/tempWork/uncompressed.pdf`,"uncompress"])
const ok=spawn(`${__dirname}/pdfimages`,["-all",`${__dirname}/tempWork/uncompressed.pdf`,"sure"],{cwd:`${__dirname}/tempWork`})
const ok=spawn(`${__dirname}/pdfimages`,["-list",`${__dirname}/tempWork/uncompressed.pdf`])
const ok=spawn(`${__dirname}/magick`,[`${__dirname}/tempWork/${v.basename}.${v.ext}`,"-channel","RGB","-negate",`${__dirname}/tempWork/${v.basename}_negate.${v.ext}`])
const ok=spawn(`${__dirname}/gswin64c`,["-o",`${__dirname}/tempWork/fixed.pdf`,"-sDEVICE=pdfwrite","-dPDFSETTINGS=/prepress",`${__dirname}/tempWork/transformed.pdf`])
const ok=spawn(`${__dirname}/pdftk`,[`${__dirname}/tempWork/fixed.pdf`,"output",`${__dirname}/tempWork/compressed.pdf`,"compress"])
```

* C:\Program Files\qpdf 11.6.1\bin\qpdf.exe<><>https://github.com/qpdf/qpdf/releases<>https://github.com/qpdf/qpdf/releases/download/v11.6.1/qpdf-11.6.1-msvc64.exe<br>
* C:\Program Files (x86)\PDFtk Server\bin\pdftk.exe<>(pdftk 2.02)<>https://www.pdflabs.com/tools/pdftk-server/<>https://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/pdftk_server-2.02-win-setup.exe<br>
* C:\Users\User\Downloads\Release-23.08.0-0\poppler-23.08.0\Library\bin\pdfimages.exe<>https://github.com/oschwartz10612/poppler-windows/releases/<>https://github.com/oschwartz10612/poppler-windows/releases/download/v23.08.0-0/Release-23.08.0-0.zip<br>
* C:\Program Files\ImageMagick-7.1.1-Q8\magick.exe<>https://imagemagick.org/script/download.php#windows<>https://imagemagick.org/archive/binaries/ImageMagick-7.1.1-19-Q8-x64-static.exe<br>
* C:\Program Files\gs\gs10.02.0\bin\gswin64c.exe<>https://github.com/ArtifexSoftware/ghostpdl-downloads/releases<>https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/download/gs10020/gs10020w64.exe<br>