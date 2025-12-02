import { gql } from '@apollo/client';

export const LOGIN_REQUEST_MUTATION = gql`
    mutation LoginRequest($email: String!) {
        loginRequest(email: $email) {
        success
        message
        }
    }
`;

export const VERIFY_OTP_MUTATION = gql`
    mutation VerifyOtp($email: String!, $otp: String!) {
        verifyOtp(email: $email, otp: $otp) {
        accessToken
        }
    }
`;
