const TROY_OUNCE_TO_GRAM = 31.1034768; 
const TWENTY_TWO_CARAT_FACTOR = 22 / 24;
const DUMMY_ONS_TRY_PRICE = 177966.88;

interface GoldPrices {
    onsAltinPrice: number;
    gramAltinPrice: number;
    ceyrekAltinPrice: number;
    tamAltinPrice: number;
    ataAltinPrice: number;
}

export async function getCalculatedGoldPrices(): Promise<GoldPrices> {
    /**
     * TODO, GOLD RATE SERVICE API INTEGRATION
     */
    const onsAltinTRYPrice = DUMMY_ONS_TRY_PRICE;
    const gramAltin24AyarPrice = onsAltinTRYPrice / TROY_OUNCE_TO_GRAM;
    const gramAltin22AyarPrice = gramAltin24AyarPrice * TWENTY_TWO_CARAT_FACTOR;

    const ceyrekAltinPrice = gramAltin22AyarPrice * 1.75;
    const tamAltinPrice = gramAltin22AyarPrice * 7.00;
    const ataAltinPrice = gramAltin22AyarPrice * 7.216;

    return {
        onsAltinPrice: parseFloat(onsAltinTRYPrice.toFixed(4)),
        gramAltinPrice: parseFloat(gramAltin24AyarPrice.toFixed(4)),
        ceyrekAltinPrice: parseFloat(ceyrekAltinPrice.toFixed(4)),
        tamAltinPrice: parseFloat(tamAltinPrice.toFixed(4)),
        ataAltinPrice: parseFloat(ataAltinPrice.toFixed(4)),
    };
}
