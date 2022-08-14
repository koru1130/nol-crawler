import https from "https";
import fs from "fs";
import { readdir } from 'node:fs/promises';
import pMap from 'p-map'

const url = 
    pageNumber => `https://nol.ntu.edu.tw/nol/coursesearch/search_for_02_dpt.php?alltime=yes&allproced=yes&selcode=-1&dptname=0&coursename=&teachername=&current_sem=111-1&yearcode=0&op=&startrec=${pageNumber*150}&week1=&week2=&week3=&week4=&week5=&week6=&proced0=&proced1=&proced2=&proced3=&proced4=&procedE=&proced5=&proced6=&proced7=&proced8=&proced9=&procedA=&procedB=&procedC=&procedD=&allsel=yes&selCode1=&selCode2=&selCode3=&page_cnt=150`

const getPage = 
    n => new Promise((resolve, reject) => {            
            console.log(`Page ${n} started...`);
            https.get(
                url(n),
                {rejectUnauthorized: false},
                res => {
                    const path = `raw/${n}.html`;
                    const writeStream = fs.createWriteStream(path);
                    
                    res.pipe(writeStream);

                    writeStream.on("finish", () => {
                        writeStream.close();                        
                        console.log(`Page ${n} completed!`);
                        resolve()
                    })
                }).on("error", err => reject(err));
        });

const toN = n => [...Array(n).keys()];

(async () => { 
    try {
        const downloaded = await readdir('raw');
        
        const toDownload = toN(100).filter(n => !downloaded.includes(`${n}.html`));        
        const result = await pMap(toDownload, getPage, {concurrency: 2});
    } catch (error) {
        console.log(error);   
    }

})();

