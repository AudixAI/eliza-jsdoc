import {
    IAgentRuntime,
    IPdfService,
    Service,
    ServiceType,
} from "@elizaos/core";
import { getDocument, PDFDocumentProxy } from "pdfjs-dist";
import { TextItem, TextMarkedContent } from "pdfjs-dist/types/src/display/api";

/**
 * A class representing a PDF service that extends the Service class and implements the IPdfService interface.
 */

export class PdfService extends Service implements IPdfService {
    static serviceType: ServiceType = ServiceType.PDF;

/**
 * Constructor for creating a new instance of the class.
 * Initializes the instance with the parent class constructor.
 */
    constructor() {
        super();
    }

/**
 * Get an instance of the PDF service.
 * 
 * @returns {IPdfService} The instance of the PDF service.
 */
    getInstance(): IPdfService {
        return PdfService.getInstance();
    }

/**
* Initializes the agent runtime with the provided _runtime object.
* 
* @param {_runtime} IAgentRuntime - The runtime object to initialize the agent with.
* @returns {Promise<void>} - A promise that resolves once the initialization is complete.
*/
    async initialize(_runtime: IAgentRuntime): Promise<void> {}

/**
 * Asynchronously converts a PDF Buffer to a single string containing the text content of all pages.
 *
 * @param {Buffer} pdfBuffer The PDF Buffer to convert to text
 * @returns {Promise<string>} A promise that resolves with the text content of the PDF
 */
    async convertPdfToText(pdfBuffer: Buffer): Promise<string> {
        // Convert Buffer to Uint8Array
        const uint8Array = new Uint8Array(pdfBuffer);

        const pdf: PDFDocumentProxy = await getDocument({ data: uint8Array })
            .promise;
        const numPages = pdf.numPages;
        const textPages: string[] = [];

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .filter(isTextItem)
                .map((item) => item.str)
                .join(" ");
            textPages.push(pageText);
        }

        return textPages.join("\n");
    }
}

// Type guard function
/**
 * Checks if the given item is a TextItem
 * 
 * @param {TextItem | TextMarkedContent} item - The item to check
 * @returns {boolean} True if the item is a TextItem, false otherwise
 */
function isTextItem(item: TextItem | TextMarkedContent): item is TextItem {
    return "str" in item;
}
