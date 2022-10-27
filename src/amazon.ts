import { getLogger } from "log4js";
import * as puppeteer from "puppeteer";

const logger = getLogger();

/**
 * Search the text in amazon.com
 * Entire the first result after searching
 * If the product exists try to add to cart and proceed to checkout (addToCartAndCheckout method)
 * @param text 
 * @returns 
 */
export async function searchInAmazon(text:string) {
    try {
        // Manipulation for physical book.
        text += " paperback hardcover"; 
        const bookName = text.split('by')[0].trim();
        const browser = await puppeteer.launch({ headless: false, defaultViewport: null});
        const page = await browser.newPage()
        await page.setViewport({ width: 1280, height: 800 })
        await Promise.all([
            page.waitForNavigation({waitUntil: "networkidle0"}), 
            await page.goto('https://www.amazon.com')
        ]);
        await page.type('#twotabsearchtextbox', text)
        
        const searchButton = await page.$('#nav-search-submit-button')
        await Promise.all([
            page.waitForNavigation({waitUntil: "networkidle0"}), 
            searchButton?.click()
        ]);
        
        // screenshot for amazon search screen
        const screenshot = "amazon-search.png";
        await page.screenshot({path: screenshot});

        const bookResults = await page.$$('.a-size-mini a');
        logger.info("Book results count : ",bookResults.length);
        if (!bookResults) {
            logger.error("Not found any result!");
            return;
        }
       
        for (const bookResult of bookResults) {
            const bookResultTitle =  await bookResult?.$eval('span', span => span.innerHTML);
            if (bookResultTitle && bookResultTitle.includes(bookName)) {
                logger.info("Book Result Title : ",bookResultTitle)
                await Promise.all([
                    page.waitForNavigation({waitUntil: "networkidle0"}), 
                    bookResult.click()
                ]);

                await addToCartAndCheckout(page)
                return
            }
        }
    } catch (error : any) {
        logger.error(error.message)
        return;
    }
}

/**
 * Try to access amazon link from https://www.goodreads.com/.
 * If the product exists try to add to cart and proceed to checkout
 * @param url 
 * @returns 
 */
export async function amazonDirection(url : string) {
    const browser = await puppeteer.launch({ headless: false, defaultViewport: null});
    const page = await browser.newPage()
    await page.goto(url);
    logger.info("Visit amazon.com site.");
    logger.info(`Opened ${page.url()}`);
    try {
        const addCartInput = await page.$('[value="Add to Cart"]')
        if (!addCartInput) {
            logger.error('No book for sale');
            return;
        }
        await Promise.all([
            page.waitForNavigation({waitUntil: "networkidle0"}), 
            addCartInput?.click()
        ]);
        logger.info('Book added to cart.');

        const checkOutButton = await page.$('[value="Proceed to checkout"]');
        await checkOutButton?.click();
        logger.info('Checkout page.');
    } catch (error : any) {
        logger.error(error.message);
        throw new Error(error.message)
    }   
}

async function addToCartAndCheckout(page: puppeteer.Page) {
    const addCartInput = await page.$('[value="Add to Cart"]')
    if (!addCartInput) {
        logger.error('No book for sale');
        return;
    }
    await Promise.all([
        page.waitForNavigation({waitUntil: "networkidle0"}), 
        addCartInput?.click()
    ]);
    logger.info('Book added to cart.');

    const checkOutButton = await page.$('[value="Proceed to checkout"]');
    await checkOutButton?.click();
    logger.info('Checkout page.');
}