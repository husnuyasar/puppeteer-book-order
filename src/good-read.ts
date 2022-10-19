
import * as puppeteer from "puppeteer";
import { BookCategory } from "./dto/bookCategory";
import { getRandomNumber } from "./utils";
import { getLogger } from "log4js";

const logger = getLogger();

/**
 * Return Category Names and Urls in https://www.goodreads.com/choiceawards/best-books-2020
 * @returns 
 */
export async function getGoodReadCategories () : Promise<BookCategory []>{
  try {
    const result = new Array<BookCategory>();
    logger.info("https://www.goodreads.com/choiceawards/best-books-2020 categories page.")
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
  
    await page.goto("https://www.goodreads.com/choiceawards/best-books-2020", {
      waitUntil: "domcontentloaded"
    });
  

    const categories =  await page.$$('div.category');
    for (let index = 0; index < categories.length; index++) {
        const aHref = await categories[index].$eval('a', el => el.getAttribute('href'));  
        const categoryName = await categories[index].$eval('h4', names => names.innerText);  
        const dto = new BookCategory;
        dto.Category = categoryName;
        dto.CategoryUrl = aHref ? `https://www.goodreads.com${aHref}` : "";
        result.push(dto);
    }
    await browser.close();
    return result;
  } catch (error : any) {
    logger.error(error. message);
    throw Error(error. message);
  }
}

/**
 * Return Amazon link on https://www.goodreads.com/
 * @param bookCategory 
 * @returns 
 */
export async function getRandomBookUrl(bookCategory:BookCategory) : Promise<string> {
  logger.info(`${bookCategory.Category} category in https://www.goodreads.com/choiceawards/best-books-2020 page.`);

  const browser = await puppeteer.launch({ headless: false, defaultViewport: null});
  const page = await browser.newPage();

  logger.info(`Opened ${bookCategory.CategoryUrl} page.`);
  await page.goto(bookCategory.CategoryUrl ?? "", {
    waitUntil: "domcontentloaded"
  });

  const books =  await page.$$('div.answerWrapper');
  const bookLength = books.length;
  const randomBookIndex = getRandomNumber(bookLength);
  try {
    const bookNameAndAuthor = await books[randomBookIndex].$eval('.js-tooltipTrigger > a > img', a => a.getAttribute('alt'));
    await Promise.all([
      page.waitForNavigation({waitUntil: "networkidle0"}), 
      await books[randomBookIndex].click()
    ]);
    
    if (bookNameAndAuthor) {
      logger.info(`${bookNameAndAuthor} book's page visited.`)
    }
    const modal = await page.waitForSelector('.modal--centered [alt="Dismiss"]',
      {timeout: 10000}
    );
    if (modal) {
      await modal?.click();
    }
    

    // screenshot for random book page
    const screenshot = `random-book-page.png`
    await page.screenshot({path: screenshot});

    const aButton = await page.$eval('a.buttonBar',a => a.getAttribute('href'));
    if (!aButton) {
      logger.error('Amazon link not found!');
    }
    await browser.close();
    return `https://www.goodreads.com${aButton}`;
  } catch (error : any) {
    logger.error(error.message);
    throw Error(error. message);
  }
  
}

/**
 * Return random book name with author.
 * @param bookCategory 
 * @returns 
 */
export async function getRandomBook(bookCategory:BookCategory) : Promise<string> {
  logger.info(`${bookCategory.Category} category in https://www.goodreads.com/choiceawards/best-books-2020 page.`);

  const browser = await puppeteer.launch({ headless: false, defaultViewport: null});
  const page = await browser.newPage();

  logger.info(`Opened ${bookCategory.CategoryUrl} page.`);
  await page.goto(bookCategory.CategoryUrl ?? "", {
    waitUntil: "domcontentloaded"
  });

  const books =  await page.$$('div.answerWrapper');
  const bookLength = books.length;
  const randomBookIndex = getRandomNumber(bookLength);
  try {
    const bookNameAndAuthor = await books[randomBookIndex].$eval('.js-tooltipTrigger > a > img', a => a.getAttribute('alt')) ?? "";
    if (!bookNameAndAuthor) {
      logger.error('Book not found!')
    }
    logger.info(`Book : ${bookNameAndAuthor}`)
    await browser.close();
    return bookNameAndAuthor;
  } catch (error : any) {
    logger.error(error.message);
    throw Error(error.message);
  }
  
}