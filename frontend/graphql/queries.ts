import { gql } from '@apollo/client';

export const SELL_PORTFOLIO = gql`
    mutation SellPortfolio($id: ID!, $amount: Float!) {
        sellPortfolio(
        input: { 
                id: $id, 
                amount: $amount 
            }
        ) {
            id
            symbol
            amount
            currentValueTRY
        }
    }
`;

export const GET_PORTFOLIOS = gql`
    query GetPortfolios {
        getPortfolios {
        id
        symbol
        amount
        currentValueTRY
        baseCurrency
        createdAt  
        purchaseRateTRY
        }
    }
`;

export const CREATE_PORTFOLIO = gql`
    mutation CreatePortfolio($symbol: String!, $amount: Float!) {
        createPortfolio(
            input: { 
                symbol: $symbol, 
                amount: $amount 
            }
        ) {
            id
            symbol
            amount
            currentValueTRY
            baseCurrency
        }
    }
`;
