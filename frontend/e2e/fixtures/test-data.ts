export const testData = {
  users: {
    validUser: {
      email: 'test@example.com',
      password: 'TestPass123!',
      username: 'testuser',
      displayName: 'Test User'
    },
    invalidUser: {
      email: 'invalid-email',
      password: '123',
      username: '',
      displayName: ''
    }
  },
  
  salons: {
    validSalon: {
      name: 'Glamour Nails Spa',
      email: 'info@glamournails.com',
      phone: '+1 (555) 123-4567',
      address: '123 Beauty Lane, Fashion District, NY 10001',
      description: 'Premium nail salon offering the latest in nail art and beauty treatments.',
      services: [
        {
          name: 'Classic Manicure',
          duration: 30,
          price: 35,
          description: 'Traditional manicure with polish'
        },
        {
          name: 'Gel Manicure',
          duration: 45,
          price: 55,
          description: 'Long-lasting gel polish manicure'
        },
        {
          name: 'Nail Art Design',
          duration: 60,
          price: 75,
          description: 'Custom nail art designs'
        }
      ]
    }
  },
  
  bookings: {
    validBooking: {
      service: 'Classic Manicure',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      time: '10:00 AM',
      duration: 30,
      price: 35
    }
  },
  
  payment: {
    validCard: {
      number: '4242424242424242', // Stripe test card
      expiry: '12/25',
      cvc: '123',
      zip: '12345'
    },
    invalidCard: {
      number: '4000000000000002', // Stripe test card that will be declined
      expiry: '12/25',
      cvc: '123',
      zip: '12345'
    }
  },
  
  search: {
    validQueries: [
      'nail salon',
      'manicure',
      'nail art',
      'beauty salon'
    ],
    invalidQueries: [
      '',
      '   ',
      'xyzabc123nonexistent'
    ]
  },
  
  locations: {
    newYork: {
      latitude: 40.7128,
      longitude: -74.0060,
      address: 'New York, NY'
    },
    losAngeles: {
      latitude: 34.0522,
      longitude: -118.2437,
      address: 'Los Angeles, CA'
    }
  }
};

export const errorMessages = {
  auth: {
    invalidEmail: 'Please enter a valid email address',
    weakPassword: 'Password must be at least 8 characters',
    userNotFound: 'User not found',
    wrongPassword: 'Incorrect password',
    emailAlreadyExists: 'Email already exists'
  },
  
  booking: {
    pastDate: 'Cannot book appointments in the past',
    unavailableTime: 'This time slot is not available',
    missingService: 'Please select a service',
    missingDate: 'Please select a date'
  },
  
  payment: {
    invalidCard: 'Your card was declined',
    expiredCard: 'Your card has expired',
    insufficientFunds: 'Insufficient funds',
    invalidCvc: 'Invalid security code'
  },
  
  form: {
    required: 'This field is required',
    invalidFormat: 'Invalid format',
    tooShort: 'Too short',
    tooLong: 'Too long'
  }
};

export const successMessages = {
  auth: {
    signupSuccess: 'Account created successfully',
    loginSuccess: 'Welcome back',
    logoutSuccess: 'Logged out successfully',
    passwordResetSent: 'Password reset email sent'
  },
  
  booking: {
    bookingConfirmed: 'Appointment booked successfully',
    bookingCancelled: 'Appointment cancelled',
    bookingUpdated: 'Appointment updated'
  },
  
  payment: {
    paymentSuccess: 'Payment processed successfully',
    refundProcessed: 'Refund processed'
  },
  
  profile: {
    profileUpdated: 'Profile updated successfully',
    imageUploaded: 'Image uploaded successfully'
  }
};