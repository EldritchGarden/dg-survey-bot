const puppeteer = require('puppeteer');

/**
 * Click next button and wait for navigation
 * @param {Page} page 
 */
async function next(page) {
    await Promise.all([
        page.click(selector.next),
        page.waitForNavigation()
    ])
}

/**
 * Fill out dg customer survey
 * @param {str} time Format HH:MM
 * @param {str} storeNum Store number with leading 0's
 * @param {str} surveyCode 15 digit survey code
 * @returns 0 if success, 1 if error
 */
async function survey(time, storeNum, surveyCode) {
    // element selectors
    var selector = {
        timeHour    : '#InputHour',
        timeMinute  : '#InputMinute',
        storeNumber : '#InputStoreNum',
        surveyCode  : '#CN1',
        next        : '#NextButton',
        radioTable  : '#surveyQuestions > table > tbody',
        checkTable  : '#surveyQuestions > fieldset > div > div',
        pastVisits  : '#FNSR000067 > div > div',
        sweepstakes : '#FNSR000043 > div > div',
        finish      : '#finishIncentive'
    }

    // create a browser and navigate to survey site
    const browser = await puppeteer.launch({headless: false});  // TODO remove headless: false
    const page = await browser.newPage();

    await page.goto('https://www.dgcustomerfirst.com/');

    // validate time
    if ( ! /^\d{2}:\d{2}/.test(time) ) {
        console.error('ERROR: time must be format "HH:MM"');
        return 1;
    }

    let [hour, minute] = time.split(':');  // split time into hour and minute

    if ( Number(hour) < 0 || Number(hour) > 23 ) {
        console.error('ERROR: invalid time range for hour');
        return 1;
    } else if (Number(minute) < 0 || Number(minute) > 59) {
        console.error('ERROR: invalid time range for minute');
        return 1;
    }

    // enter survey code
    await page.select(selector.timeHour, hour);  // select hour
    await page.select(selector.timeMinute, minute);  // select minute

    await page.click(selector.storeNumber);  // enter store number
    await page.keyboard.type(storeNum);

    await page.click(selector.surveyCode);  // enter survey code
    await page.keyboard.type(surveyCode);

    next(page);

    // TODO fill out survey
    // order of survey questions changes randomly
    // use page.$$eval to iterate over buttons?

    var atEnd = false;
    while (! atEnd) {
        if ( page.$(selector.finish) ) {  // break if at end of survey
            atEnd = true;
            break;
        } else if ( page.$(selector.radioTable) ) {  // press all highly satisfied buttons
            let buttons = await page.$$eval(selector.radioTable + " input");
            // get buttons with val 5, for highly satisfied
            let nodes = buttons.filter( (node) => /#\w*\d*\.5/.test(node) );
            if ( ! nodes ) {  // some questions only have yes/no, choose yes (val 1) in this case
                nodes = buttons.filter( (node) => /#\w*\d*\.1/.test(node) );
            }
            for ( let node in nodes ) {
                await page.click(node);  // click all the buttons
            }
        } else if ( page.$(selector.checkTable) ) {
            let buttons = await page.$$eval(selector.checkTable + " input");
            buttons = buttons.filter( (node) => ! /other/i.test(node) );
            for ( let i = 0; i < Math.floor((Math.random() * 6) + 1); i++ );
        } // TODO
    }
}

survey("13:24", "01541", "111122223333444")  // test values
