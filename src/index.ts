import { amazonDirection, searchInAmazon } from "./amazon";
import { getGoodReadCategories, getRandomBook, getRandomBookUrl } from "./good-read";
import prompts from "prompts";
import { configure, getLogger } from "log4js";

const logger = getLogger();
configure('log4js.json');
configure({
    appenders: { console: { type: "console" } },
    categories: { default: { appenders: ["console"], level: "info" } },
});

(async () => {
    try {
        logger.info("Project started!")
        const categories = await getGoodReadCategories();
        const response = await prompts([
        {
            type: 'select',
            name: 'genre',
            message: 'Select a genre',
            choices: categories.map((bookCategory) => {
                return {
                    title: bookCategory.Category ?? "",
                    value:bookCategory.Category ?? "",
                }
            })
        }
        ]);
        logger.log("Selected genre : ",response.genre);
        
        const genreIndex = categories.map(bCategory => bCategory.Category).indexOf(response.genre);
        if (genreIndex === -1) {
            logger.error("Genre not found!");
            return;
        }
        const randomCategory = categories[genreIndex];

        // Switch 1 : search in amazon
        const book = await getRandomBook(randomCategory);
        if (!book) {
            logger.error('Book not found!');
        }
        await searchInAmazon(book);

        // Switch 2 : go to Amazon with goodreads.com Amazon link.
        // const bookLink = await getRandomBookUrl(randomCategory);
        // await amazonDirection(bookLink);
    } catch (error : any ) {
        logger.error(error.message);
    }
    
    
})();


