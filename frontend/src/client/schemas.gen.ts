// This file is auto-generated by @hey-api/openapi-ts

export const Body_login_login_access_tokenSchema = {
    properties: {
        grant_type: {
            anyOf: [
                {
                    type: 'string',
                    pattern: 'password'
                },
                {
                    type: 'null'
                }
            ],
            title: 'Grant Type'
        },
        username: {
            type: 'string',
            title: 'Username'
        },
        password: {
            type: 'string',
            title: 'Password'
        },
        scope: {
            type: 'string',
            title: 'Scope',
            default: ''
        },
        client_id: {
            anyOf: [
                {
                    type: 'string'
                },
                {
                    type: 'null'
                }
            ],
            title: 'Client Id'
        },
        client_secret: {
            anyOf: [
                {
                    type: 'string'
                },
                {
                    type: 'null'
                }
            ],
            title: 'Client Secret'
        }
    },
    type: 'object',
    required: ['username', 'password'],
    title: 'Body_login-login_access_token'
} as const;

export const HTTPValidationErrorSchema = {
    properties: {
        detail: {
            items: {
                '$ref': '#/components/schemas/ValidationError'
            },
            type: 'array',
            title: 'Detail'
        }
    },
    type: 'object',
    title: 'HTTPValidationError'
} as const;

export const ItemCreateSchema = {
    properties: {
        title: {
            type: 'string',
            maxLength: 255,
            minLength: 1,
            title: 'Title'
        },
        description: {
            anyOf: [
                {
                    type: 'string',
                    maxLength: 255
                },
                {
                    type: 'null'
                }
            ],
            title: 'Description'
        },
        images: {
            anyOf: [
                {
                    type: 'string'
                },
                {
                    type: 'null'
                }
            ],
            title: 'Images'
        },
        model: {
            anyOf: [
                {
                    type: 'string'
                },
                {
                    type: 'null'
                }
            ],
            title: 'Model'
        },
        certificate: {
            anyOf: [
                {
                    type: 'string'
                },
                {
                    type: 'null'
                }
            ],
            title: 'Certificate'
        }
    },
    type: 'object',
    required: ['title'],
    title: 'ItemCreate'
} as const;

export const ItemPublicSchema = {
    properties: {
        title: {
            type: 'string',
            maxLength: 255,
            minLength: 1,
            title: 'Title'
        },
        description: {
            anyOf: [
                {
                    type: 'string',
                    maxLength: 255
                },
                {
                    type: 'null'
                }
            ],
            title: 'Description'
        },
        images: {
            anyOf: [
                {
                    type: 'string'
                },
                {
                    type: 'null'
                }
            ],
            title: 'Images'
        },
        model: {
            anyOf: [
                {
                    type: 'string'
                },
                {
                    type: 'null'
                }
            ],
            title: 'Model'
        },
        certificate: {
            anyOf: [
                {
                    type: 'string'
                },
                {
                    type: 'null'
                }
            ],
            title: 'Certificate'
        },
        id: {
            type: 'string',
            format: 'uuid',
            title: 'Id'
        },
        owner_id: {
            type: 'string',
            format: 'uuid',
            title: 'Owner Id'
        }
    },
    type: 'object',
    required: ['title', 'id', 'owner_id'],
    title: 'ItemPublic'
} as const;

export const ItemUpdateSchema = {
    properties: {
        title: {
            anyOf: [
                {
                    type: 'string',
                    maxLength: 255,
                    minLength: 1
                },
                {
                    type: 'null'
                }
            ],
            title: 'Title'
        },
        description: {
            anyOf: [
                {
                    type: 'string',
                    maxLength: 255
                },
                {
                    type: 'null'
                }
            ],
            title: 'Description'
        },
        images: {
            anyOf: [
                {
                    type: 'string'
                },
                {
                    type: 'null'
                }
            ],
            title: 'Images'
        },
        model: {
            anyOf: [
                {
                    type: 'string'
                },
                {
                    type: 'null'
                }
            ],
            title: 'Model'
        },
        certificate: {
            anyOf: [
                {
                    type: 'string'
                },
                {
                    type: 'null'
                }
            ],
            title: 'Certificate'
        }
    },
    type: 'object',
    title: 'ItemUpdate'
} as const;

export const ItemsPublicSchema = {
    properties: {
        data: {
            items: {
                '$ref': '#/components/schemas/ItemPublic'
            },
            type: 'array',
            title: 'Data'
        },
        count: {
            type: 'integer',
            title: 'Count'
        }
    },
    type: 'object',
    required: ['data', 'count'],
    title: 'ItemsPublic'
} as const;

export const MessageSchema = {
    properties: {
        message: {
            type: 'string',
            title: 'Message'
        }
    },
    type: 'object',
    required: ['message'],
    title: 'Message'
} as const;

export const NewPasswordSchema = {
    properties: {
        token: {
            type: 'string',
            title: 'Token'
        },
        new_password: {
            type: 'string',
            maxLength: 40,
            minLength: 8,
            title: 'New Password'
        }
    },
    type: 'object',
    required: ['token', 'new_password'],
    title: 'NewPassword'
} as const;

export const PrivateUserCreateSchema = {
    properties: {
        email: {
            type: 'string',
            title: 'Email'
        },
        password: {
            type: 'string',
            title: 'Password'
        },
        full_name: {
            type: 'string',
            title: 'Full Name'
        },
        is_verified: {
            type: 'boolean',
            title: 'Is Verified',
            default: false
        }
    },
    type: 'object',
    required: ['email', 'password', 'full_name'],
    title: 'PrivateUserCreate'
} as const;

export const TokenSchema = {
    properties: {
        access_token: {
            type: 'string',
            title: 'Access Token'
        },
        token_type: {
            type: 'string',
            title: 'Token Type',
            default: 'bearer'
        }
    },
    type: 'object',
    required: ['access_token'],
    title: 'Token'
} as const;

export const UpdatePasswordSchema = {
    properties: {
        current_password: {
            type: 'string',
            maxLength: 40,
            minLength: 8,
            title: 'Current Password'
        },
        new_password: {
            type: 'string',
            maxLength: 40,
            minLength: 8,
            title: 'New Password'
        }
    },
    type: 'object',
    required: ['current_password', 'new_password'],
    title: 'UpdatePassword'
} as const;

export const UserCreateSchema = {
    properties: {
        email: {
            type: 'string',
            maxLength: 255,
            format: 'email',
            title: 'Email'
        },
        is_active: {
            type: 'boolean',
            title: 'Is Active',
            default: true
        },
        is_superuser: {
            type: 'boolean',
            title: 'Is Superuser',
            default: false
        },
        has_privileges: {
            type: 'boolean',
            title: 'Has Privileges',
            default: false
        },
        full_name: {
            anyOf: [
                {
                    type: 'string',
                    maxLength: 255
                },
                {
                    type: 'null'
                }
            ],
            title: 'Full Name'
        },
        password: {
            type: 'string',
            maxLength: 40,
            minLength: 8,
            title: 'Password'
        }
    },
    type: 'object',
    required: ['email', 'password'],
    title: 'UserCreate'
} as const;

export const UserPublicSchema = {
    properties: {
        email: {
            type: 'string',
            maxLength: 255,
            format: 'email',
            title: 'Email'
        },
        is_active: {
            type: 'boolean',
            title: 'Is Active',
            default: true
        },
        is_superuser: {
            type: 'boolean',
            title: 'Is Superuser',
            default: false
        },
        has_privileges: {
            type: 'boolean',
            title: 'Has Privileges',
            default: false
        },
        full_name: {
            anyOf: [
                {
                    type: 'string',
                    maxLength: 255
                },
                {
                    type: 'null'
                }
            ],
            title: 'Full Name'
        },
        id: {
            type: 'string',
            format: 'uuid',
            title: 'Id'
        }
    },
    type: 'object',
    required: ['email', 'id'],
    title: 'UserPublic'
} as const;

export const UserRegisterSchema = {
    properties: {
        email: {
            type: 'string',
            maxLength: 255,
            format: 'email',
            title: 'Email'
        },
        password: {
            type: 'string',
            maxLength: 40,
            minLength: 8,
            title: 'Password'
        },
        full_name: {
            anyOf: [
                {
                    type: 'string',
                    maxLength: 255
                },
                {
                    type: 'null'
                }
            ],
            title: 'Full Name'
        }
    },
    type: 'object',
    required: ['email', 'password'],
    title: 'UserRegister'
} as const;

export const UserUpdateSchema = {
    properties: {
        email: {
            anyOf: [
                {
                    type: 'string',
                    maxLength: 255,
                    format: 'email'
                },
                {
                    type: 'null'
                }
            ],
            title: 'Email'
        },
        is_active: {
            type: 'boolean',
            title: 'Is Active',
            default: true
        },
        is_superuser: {
            type: 'boolean',
            title: 'Is Superuser',
            default: false
        },
        has_privileges: {
            type: 'boolean',
            title: 'Has Privileges',
            default: false
        },
        full_name: {
            anyOf: [
                {
                    type: 'string',
                    maxLength: 255
                },
                {
                    type: 'null'
                }
            ],
            title: 'Full Name'
        },
        password: {
            anyOf: [
                {
                    type: 'string',
                    maxLength: 40,
                    minLength: 8
                },
                {
                    type: 'null'
                }
            ],
            title: 'Password'
        }
    },
    type: 'object',
    title: 'UserUpdate'
} as const;

export const UserUpdateMeSchema = {
    properties: {
        full_name: {
            anyOf: [
                {
                    type: 'string',
                    maxLength: 255
                },
                {
                    type: 'null'
                }
            ],
            title: 'Full Name'
        },
        email: {
            anyOf: [
                {
                    type: 'string',
                    maxLength: 255,
                    format: 'email'
                },
                {
                    type: 'null'
                }
            ],
            title: 'Email'
        }
    },
    type: 'object',
    title: 'UserUpdateMe'
} as const;

export const UsersPublicSchema = {
    properties: {
        data: {
            items: {
                '$ref': '#/components/schemas/UserPublic'
            },
            type: 'array',
            title: 'Data'
        },
        count: {
            type: 'integer',
            title: 'Count'
        }
    },
    type: 'object',
    required: ['data', 'count'],
    title: 'UsersPublic'
} as const;

export const ValidationErrorSchema = {
    properties: {
        loc: {
            items: {
                anyOf: [
                    {
                        type: 'string'
                    },
                    {
                        type: 'integer'
                    }
                ]
            },
            type: 'array',
            title: 'Location'
        },
        msg: {
            type: 'string',
            title: 'Message'
        },
        type: {
            type: 'string',
            title: 'Error Type'
        }
    },
    type: 'object',
    required: ['loc', 'msg', 'type'],
    title: 'ValidationError'
} as const;