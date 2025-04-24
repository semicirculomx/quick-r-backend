import joi from 'joi';

export const userSignUp = joi.object({
    name: joi.string().min(3).max(30).required(),
    email: joi.string().email({ minDomainSegments: 2 }).required(),
    password: joi.string().min(6).max(30).required(),
    phone: joi.string().pattern(/^[+()0-9\s]{10,20}$/).required(), // Allows +, (, ), spaces, and digits
    ageVerified: joi.boolean().required(),
});
