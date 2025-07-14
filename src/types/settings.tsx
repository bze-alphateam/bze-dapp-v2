// Validation result type
export interface ValidationResult {
    isValid: boolean
    error?: string
}

// BeeZee endpoint configuration
export interface BeeZeeEndpoints {
    restEndpoint: string
    rpcEndpoint: string
}

// Main application settings
export interface AppSettings {
    endpoints: BeeZeeEndpoints
}

// Validation results for both endpoints
export interface EndpointValidationResults {
    rest?: ValidationResult
    rpc?: ValidationResult
}