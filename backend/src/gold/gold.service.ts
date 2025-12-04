import { Injectable, Logger } from "@nestjs/common";
import { RateService } from "src/rate/rate.service";

const TROY_OUNCE_TO_GRAM = 31.1034768; 
const TWENTY_TWO_CARAT_FACTOR = 22 / 24;
const DUMMY_ONS_USD_PRICE = 4209.00;

interface GoldPrices {
    GRAM_ALTIN: number;
    CEYREK_ALTIN: number;
    TAM_ALTIN: number;
    ATA_ALTIN: number;
    [key: string]: number;
}

@Injectable()
export class GoldService {
    private readonly logger = new Logger(GoldService.name);
    constructor(private readonly rateService: RateService) {}

    public async getCalculatedGoldPrices(): Promise<GoldPrices> {
        let usdTryRate = await this.rateService.getRate('USD/TRY');

        const onsAltinUSDPrice = DUMMY_ONS_USD_PRICE;
        const onsAltinTRYPrice = onsAltinUSDPrice * usdTryRate; 
        
        const gramAltin24AyarPrice = onsAltinTRYPrice / TROY_OUNCE_TO_GRAM;
        const gramAltin22AyarPrice = gramAltin24AyarPrice * TWENTY_TWO_CARAT_FACTOR;

        const ceyrekAltinPrice = gramAltin22AyarPrice * 1.75;
        const tamAltinPrice = gramAltin22AyarPrice * 7.00;
        const ataAltinPrice = gramAltin22AyarPrice * 7.216;

        let goldPrices = {
            GRAM_ALTIN: parseFloat(gramAltin24AyarPrice.toFixed(4)),
            CEYREK_ALTIN: parseFloat(ceyrekAltinPrice.toFixed(4)),
            TAM_ALTIN: parseFloat(tamAltinPrice.toFixed(4)),
            ATA_ALTIN: parseFloat(ataAltinPrice.toFixed(4)),
        };

        this.logger.log(goldPrices);

        return goldPrices;
    }
}
