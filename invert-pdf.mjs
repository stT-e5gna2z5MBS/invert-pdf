import { spawn } from "child_process"
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "fs"

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// const pdfName = `${__dirname}/VyacheslavEgorov_BenchmarkingJavaScript.pdf`
const pdfName = process.argv[2]

try {
    rmSync(`${__dirname}/tempWork`,{recursive:true})
} catch (error) {
    console.log(error)
}
mkdirSync(`${__dirname}/tempWork`,{recursive:true})

await new Promise(resolve=>{
    const ok=spawn(`${__dirname}/qpdf`,[pdfName,"--decrypt",`${__dirname}/tempWork/decrypted.pdf`])
    const toConcat=[]
    ok.stdout.on("data",chunk=>{
        toConcat.push(chunk)
        console.log(chunk.toString())
    })
    ok.stderr.on("data",chunk=>{
        console.log(chunk.toString())
    })
    ok.stdout.on("end",()=>{
        resolve()
    })
})

await new Promise(resolve=>{
    const ok=spawn(`${__dirname}/pdftk`,[`${__dirname}/tempWork/decrypted.pdf`,"output",`${__dirname}/tempWork/uncompressed.pdf`,"uncompress"])
    const toConcat=[]
    ok.stdout.on("data",chunk=>{
        toConcat.push(chunk)
        console.log(chunk.toString())
    })
    ok.stderr.on("data",chunk=>{
        console.log(chunk.toString())
    })
    ok.stdout.on("end",()=>{
        resolve()
    })
})

await new Promise(resolve=>{
    const ok=spawn(`${__dirname}/pdfimages`,["-all",`${__dirname}/tempWork/uncompressed.pdf`,"sure"],{cwd:`${__dirname}/tempWork`})
    const toConcat=[]
    ok.stdout.on("data",chunk=>{
        toConcat.push(chunk)
        console.log(chunk.toString())
    })
    ok.stderr.on("data",chunk=>{
        console.log(chunk.toString())
    })
    ok.stdout.on("end",()=>{
        resolve()
    })
})

const ok=spawn(`${__dirname}/pdfimages`,["-list",`${__dirname}/tempWork/uncompressed.pdf`])
const toConcat=[]
ok.stdout.on("data",chunk=>{
    toConcat.push(chunk)
    console.log(chunk.toString())
})
ok.stderr.on("data",chunk=>{
    console.log(chunk.toString())
})
ok.stdout.on("end",async ()=>{
    const lol=Buffer.concat(toConcat).toString().replace(/\r/g,"")
    const keys = lol.slice(0,lol.indexOf("\n")).trim().replace(/\s+/g," ").split(" ")
    const lol2=lol.slice(lol.indexOf("\n",lol.indexOf("\n")+1)+1).trim()
    const arr = lol2.split("\n").map(v=>Object.fromEntries(v.trim().replace(/\s+/g," ").split(" ").map((v,i)=>[keys[i],v])))
    const arr2 = Array.from((new Map(arr.map(v=>[v.object,v]))).values())
    const ext={jpeg:"jpg",image:"png"}
    const arr3 = arr2.map(v=>({basename:(()=>{
        if (v.num===undefined) {
            debugger
        }
        return `sure-${v.num.padStart(3,"0")}`
    })(),ext:(()=>{
        if (!ext[v.enc]) {
            debugger
        }
        return ext[v.enc]
    })(),object:v.object,width:v.width}))

    await Promise.all(arr3.map(v=>new Promise(resolve=>{
        const ok=spawn(`${__dirname}/magick`,[`${__dirname}/tempWork/${v.basename}.${v.ext}`,"-channel","RGB","-negate",`${__dirname}/tempWork/${v.basename}_negate.${v.ext}`])
        const toConcat=[]
        ok.stdout.on("data",chunk=>{
            toConcat.push(chunk)
            console.log(chunk.toString())
        })
        ok.stderr.on("data",chunk=>{
            console.log(chunk.toString())
        })
        ok.stdout.on("end",()=>{
            resolve()
        })
    })))

    console.log(arr3)
    let buf = readFileSync(`${__dirname}/tempWork/uncompressed.pdf`)
    for (const v of arr3) {
        const pos_object = buf.indexOf(`\n${v.object} 0 obj`)
        const pos_stream = buf.indexOf("stream",pos_object) + 7

        let paletteBuf
        const imageBuf = readFileSync(`${__dirname}/tempWork/${v.basename}_negate.${v.ext}`)
        const streamBuf = v.ext==="png" ? (()=>{
            const buf = imageBuf
            const toConcat = []
            let i = 8
            while (true) {
                const Chunk_Type = buf.toString("utf8", i + 4, i + 8)
                const Length = buf.readUint32BE(i)
                if (Chunk_Type === "IDAT") {
                    toConcat.push(buf.subarray(i + 8,i + 8 + Length))
                } else if (Chunk_Type === "IEND") {
                    return Buffer.concat(toConcat)
                } else if (Chunk_Type === "PLTE") {
                    paletteBuf=buf.subarray(i + 8,i + 8 + Length)
                }
                // console.log(Length, Chunk_Type)
                i += Length + 12
            }
        })() : imageBuf

        let paletteLength, paletteStr
        if (paletteBuf) {
            paletteLength = Math.trunc(paletteBuf.length / 3)
            paletteStr = `<${paletteBuf.toString("hex").toUpperCase()}>`
        }

        const new_meta = (lines=>{
            const new_lines=[]
            for (const line of lines) {
                if (line.indexOf("/Length") > -1) {
                    new_lines.push(`/Length ${streamBuf.length}`)
                    if (v.ext==="png") {
                        new_lines.push("/Filter /FlateDecode")
                        new_lines.push("/DecodeParms <<")
                        new_lines.push("    /BitsPerComponent 8")
                        new_lines.push("    /Predictor 15")
                        new_lines.push(`    /Columns ${v.width}`)
                        new_lines.push(`    /Colors ${paletteBuf ? 1 : 3}`)
                        new_lines.push(">>")
                        new_lines.push(`/ColorSpace ${paletteBuf ? `[ /Indexed /DeviceRGB ${paletteLength-1} ${paletteStr} ]` : "/DeviceRGB"}`)
                    }
                    continue
                }
                if (line.indexOf("/Filter") > -1 && v.ext==="png") {
                    continue
                }
                if (line.indexOf("/ColorSpace") > -1 && v.ext==="png") {
                    continue
                }
                new_lines.push(line)
            }
            return new_lines.join("\n")
        })(buf.toString("utf8",pos_object,pos_stream).split("\n"))

        const pos_endstream = buf.indexOf("endstream",pos_stream) - 1

        buf = Buffer.concat([buf.subarray(0,pos_object),Buffer.from(new_meta),streamBuf,buf.subarray(pos_endstream)])
    }
    writeFileSync(`${__dirname}/tempWork/transformed.pdf`,buf)


    await new Promise(resolve=>{
        const ok=spawn(`${__dirname}/gswin64c`,["-o",`${__dirname}/tempWork/fixed.pdf`,"-sDEVICE=pdfwrite","-dPDFSETTINGS=/prepress",`${__dirname}/tempWork/transformed.pdf`])
        const toConcat=[]
        ok.stdout.on("data",chunk=>{
            toConcat.push(chunk)
            console.log(chunk.toString())
        })
        ok.stderr.on("data",chunk=>{
            console.log(chunk.toString())
        })
        ok.stdout.on("end",()=>{
            resolve()
        })
    })

    await new Promise(resolve=>{
        const ok=spawn(`${__dirname}/pdftk`,[`${__dirname}/tempWork/fixed.pdf`,"output",`${__dirname}/tempWork/compressed.pdf`,"compress"])
        const toConcat=[]
        ok.stdout.on("data",chunk=>{
            toConcat.push(chunk)
            console.log(chunk.toString())
        })
        ok.stderr.on("data",chunk=>{
            console.log(chunk.toString())
        })
        ok.stdout.on("end",()=>{
            resolve()
        })
    })

})