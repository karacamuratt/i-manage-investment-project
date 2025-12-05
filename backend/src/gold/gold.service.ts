import { Injectable, Logger } from "@nestjs/common";
import { RateService } from "src/rate/rate.service";

const TROY_OUNCE_TO_GRAM = 31.1034768;
const TWENTY_TWO_CARAT_FACTOR = 22 / 24;

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
        try {
            const onsAltinUSDPrice = await this.rateService.getRate('XAU/USD');
            const usdTryRate = await this.rateService.getRate('USD/TRY');

            if (!onsAltinUSDPrice || !usdTryRate) {
                this.logger.error("Could not fetch gold or USD/TRY rate");
                return this.emptyResult();
            }

            const onsAltinTRYPrice = onsAltinUSDPrice * usdTryRate;

            const gramAltin24AyarPrice = onsAltinTRYPrice / TROY_OUNCE_TO_GRAM;
            const gramAltin22AyarPrice = gramAltin24AyarPrice * TWENTY_TWO_CARAT_FACTOR;

            const ceyrekAltinPrice = gramAltin22AyarPrice * 1.75;
            const tamAltinPrice = gramAltin22AyarPrice * 7.0;
            const ataAltinPrice = gramAltin22AyarPrice * 7.216;

            const result: GoldPrices = {
                GRAM_ALTIN: parseFloat(gramAltin24AyarPrice.toFixed(4)),
                CEYREK_ALTIN: parseFloat(ceyrekAltinPrice.toFixed(4)),
                TAM_ALTIN: parseFloat(tamAltinPrice.toFixed(4)),
                ATA_ALTIN: parseFloat(ataAltinPrice.toFixed(4)),
            };

            this.logger.log(result);
            return result;
        } catch (error) {
            this.logger.error("Error calculating gold prices", error);
            return this.emptyResult();
        }
    }

    private emptyResult(): GoldPrices {
        return {
            GRAM_ALTIN: 0,
            CEYREK_ALTIN: 0,
            TAM_ALTIN: 0,
            ATA_ALTIN: 0,
        };
    }
}
