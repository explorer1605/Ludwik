import YahooFinance from 'yahoo-finance2';
import fs from 'fs';
import { Parser } from '@json2csv/plainjs';
const yf=new YahooFinance();

//set these parameters first:
const OUTPUT_FILE = './trainingData/dollarindex.csv';
const symb='DX-Y.NYB'; //gold futures
//Gold Spot: XAUUSD=X  =>	The current market price of gold against the US Dollar.
//Gold ETF:	GLD	       =>   SPDR Gold Shares (tracks the price of gold bullion).
const SD='2025-12-01';
const ED='2025-12-05';

const history=async (symbol=symb, startDate=SD, endDate=ED)=>{
    try {
        const result=await yf.historical(symbol,
         {
        period1:startDate, 
         period2:endDate,
         interval:'1d' 
        });
    console.log(result);
    return result;
    } catch (error) {
        console.error(`Error fetching data for ${startDate} to ${endDate}:`, error.message);
        return [];
    }
    
}   
 function DatatoCSV(data,isFirstBatch=true){
  if (!data || data.length === 0) return;

  try {
    // 2. Only write headers on the very first batch
    const parser = new Parser({ header: isFirstBatch });
    const csv = parser.parse(data);
    
    // Add a newline character at the end so the next batch starts on a fresh row
    fs.appendFileSync(OUTPUT_FILE, csv + '\n');
    console.log(`Successfully saved ${data.length} rows to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error("Error:", error.message);
  }
}
//endyear not included, so it will fetch data until 2025-12-31
async function savetoCSV(startyr,endyr){
    let startDate=`${startyr}-01-01`;
    let endDate=`${startyr}-12-31`;
    let isFirstBatch = true;
 for(let i=1;i<=(endyr-startyr);i++){
    
   const data=await history(symb, startDate, endDate)
    if(data.length>0) {
        DatatoCSV(data,isFirstBatch);
    isFirstBatch = false;
    }
    startyr++;
    startDate=`${startyr}-01-01`;
    endDate=`${startyr}-12-31`;
    await new Promise(resolve => setTimeout(resolve, 500));
}
}
async function goldCurrentPrice(){
    const quote = await yf.quoteSummary(symb);
    console.log(quote);
    return quote;
}
// savetoCSV(2000,2011);
savetoCSV(2000,2026);
// module.exports={
//     history,
//     goldCurrentPrice}
