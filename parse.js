
import fs from 'fs';
import { JSDOM } from 'jsdom'
import * as R from 'rambda'

let maybeMissing = [];

const readNthHTML = n => {
    const path = `raw/${n}.html`;
    return fs.readFileSync(path, 'utf8');
}

const parseNthHTML = n => {
    const html = readNthHTML(n)
    const result = Array.from(getTable(html).children).slice(1).map(parseRow)
    console.log(`Page ${n}: ${result.length} courses`)
    if(result.length < 150){
        maybeMissing.push(n);
    }
    return result
}

const getTable = html => {     
    
    //const doc = parseHtml(html)
    const doc = (new JSDOM(html)).window.document

    const xpath = "//td[text()='流水號']"
    
    // const ele流水號 = $( "td:contains('流水號')" ); 
    // const ele流水號 = xpath.fromPageSource(html).findElement("//td[text()='流水號']")
    // const ele流水號 = doc.evaluate(xpath, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue    

    //const ele流水號 = doc.querySelectorAll('td').find(x => x.textContent === '流水號')
    
    //return ele流水號.parentElement.parentElement;
    const result = doc.querySelector("body > table:nth-child(2) > tbody > tr > td > font > table:nth-child(4) > tbody")    
    //console.log(result)
    return result 
}

const parseRow = row => {
    //console.log(row.children[0].innerText)
    const getNthCol = n => row.children[n];
    const getNthColText = n => getNthCol(n).textContent.trim()
    const {weeks, times} = parse時間教室(getNthColText(12))
    return {
        流水號:   getNthColText(0),
        授課對象: getNthColText(1),
        課號: getNthColText(2),
        班次: getNthColText(3),
        課程名稱: getNthColText(4),
        領域專長: getNthColText(5),
        學分: getNthColText(6),
        課程識別碼: getNthColText(7),
        全半年: getNthColText(8),
        必選修: getNthColText(9),
        授課教師: getNthColText(10),
        加選方式: getNthColText(11),
        時間教室: getNthColText(12),
        總人數: getNthColText(13),
        選課限制條件: getNthColText(14),
        備註: getNthColText(15),
        weeks: weeks,
        times: times
    }
}

const reTime = /([一二三四五六])([\dABCD]+(?:,[\dABCD]+)*)\((.+?)\)/g
const reWeek = /第(\d(?:,\d+)*)\s*週/

const dayOfWeekToNumber = x => {
    // 如下，一是 0
    switch (x) {
        case '一':
            return 0
                        
        case '二':
            return 1
                        
        case '三':
            return 2
                        
        case '四':
            return 3
                        
        case '五':
            return 4
                        
        case '六':
            return 5
                        
        case '一':
            return 1
    
        default: 
            console.error("WTF")
    }
}

const parseTimeToInt = x => {
    switch (x) {
        case 'A':
            return 11

        case 'B':
            return 12

        case 'C':
            return 13
            
        case 'D':
            return 14
                    
        default:
            return parseInt(x)
    }
}

//https://stackoverflow.com/a/47907583
function groupArray(a) {
    const ret = [];
    if (!a.length) return ret;
    let ixf = 0;
    for (let ixc = 1; ixc < a.length; ixc += 1) {
      if (a[ixc] !== a[ixc-1] + 1) {
        ret.push(a.slice(ixf, ixc));
        ixf = ixc;  
      }
    }
    ret.push(a.slice(ixf, a.length));
    return ret;
  }

const parse時間教室 = str => {
    const reWeeksResult = str.match(reWeek)
    const weeks = reWeeksResult ? reWeeksResult[1].split(',').map(x => parseInt(x)) : "ALL"
    const reTimeResult = Array.from(str.matchAll(reTime))
    
    const times = 
        (reTimeResult.length != 0) ?
        (reTimeResult.map( y => {
                let timeArr = y[2].split(',').map(parseTimeToInt)
                const temp = groupArray(timeArr).map(z =>({
                    dayOfWeek : dayOfWeekToNumber(y[1]),
                    startTime: z[0],
                    endTime: z[z.length - 1],
                    duration: z[z.length-1] - z[0] + 1,
                    location: y[3]
                }))
                // console.log(temp)
                return temp
            }                    
        ).flat()
        )
        : "N/A"
    return {
        weeks: weeks,
        times: times
    }
}

// console.log(parseRow(getTable(readNthHTML(1)).children[1]))
//console.log((getTable(readNthHTML(1)).children[1].children[0].innerHTML))
// console.log(JSON.stringify(parseNthHTML(10)))

const toN = n => [...Array(n).keys()];
const unique = arr => [...(new Set(arr))]

const parseAll = n => {
    const temp = toN(n).flatMap(x => parseNthHTML(x))
    const result = R.pipe(
        // R.map(x=>x)
        R.filter( x => x.流水號),
        R.groupBy( x => x.流水號),
        R.map( x => ({
            ...x[0],
            授課對象: unique(x.map( y => y.授課對象 ).filter( y => y != "")),
        }))
    )(temp)
    if(maybeMissing) {
        console.log(`WARNING: Page ${maybeMissing} may miss some courses.`)
        console.log(`Please check the pages and manually paste the full content into the page if missing.`)
    }
    return result
}

//console.log(JSON.stringify(parseAll(99)))

const result = parseAll(100);
fs.writeFileSync('./result.json', JSON.stringify(result))