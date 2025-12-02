export interface LoginRequestResponse {
    loginRequest: {
        success: boolean;
        message: string;
    };
}

export interface VerifyOtpResponse {
    verifyOtp: {
        accessToken: string;
    };
}
