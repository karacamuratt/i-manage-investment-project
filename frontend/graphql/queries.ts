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
        isManualRate
        }
    }
`;

export const CREATE_PORTFOLIO = gql`
    mutation CreatePortfolio($symbol: String!, $amount: Float!, $purchaseRateTRY: Float!, $isManualRate: Boolean!) {
        createPortfolio(
            input: { 
                symbol: $symbol, 
                amount: $amount,
                purchaseRateTRY: $purchaseRateTRY,
                isManualRate: $isManualRate 
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

export const GET_RATE = gql`
    query GetRate($symbolPair: String!) {
        getRate(symbolPair: $symbolPair)
    }
`;

export const GET_USER_PROFILE = gql`
    query GetUserProfile {
        getUserProfile {
            id
            email
            firstName
            lastName
            createdAt
        }
    }
`;

export const UPDATE_USER_PROFILE = gql`
    mutation UpdateUserProfile($firstName: String!, $lastName: String!) {
        updateUserProfile(input: { firstName: $firstName, lastName: $lastName }) {
            id
            firstName
            lastName
        }
    }
`;

export const CREATE_ALERT = gql`
    mutation CreateAlert($symbol: String!, $targetPrice: Float!) {
        createAlert(input: { symbol: $symbol, targetPrice: $targetPrice }) {
            id
            symbol
            targetPrice
        }
    }
`;
