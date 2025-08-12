import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  Grid,
} from "@mui/material";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import api from "../api/api";
import toast from "react-hot-toast";

// Load Stripe with your publishable key
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({
  amount,
  currency,
  onSuccess,
  onError,
  customerData,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState(null);
  const [billingDetails, setBillingDetails] = useState({
    name: customerData?.name || "",
    email: customerData?.email || "",
    address: {
      line1: customerData?.address || "",
      city: customerData?.city || "",
      postal_code: customerData?.postalCode || "",
      country: customerData?.country || "US",
    },
  });

  useEffect(() => {
    // Create payment intent when component mounts
    const createPaymentIntent = async () => {
      try {
        const response = await api.post("/payments/create-intent", {
          amount,
          currency,
          customerEmail: billingDetails.email,
        });

        if (response.data.success) {
          setClientSecret(response.data.clientSecret);
        } else {
          setError("Failed to initialize payment");
        }
      } catch (err) {
        console.error("Error creating payment intent:", err);
        setError("Failed to initialize payment");
      }
    };

    if (amount > 0) {
      createPaymentIntent();
    }
  }, [amount, currency]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: billingDetails,
          },
        }
      );

      if (error) {
        setError(error.message);
        onError && onError(error);
        toast.error(`Payment failed: ${error.message}`);
      } else if (paymentIntent.status === "succeeded") {
        // Confirm payment on backend
        const confirmResponse = await api.post("/payments/confirm", {
          transactionId: paymentIntent.id,
          paymentMethod: "stripe",
          amount: paymentIntent.amount / 100,
          customerEmail: billingDetails.email,
        });

        if (confirmResponse.data.success) {
          toast.success("Payment successful!");
          onSuccess &&
            onSuccess({
              paymentIntent,
              transactionId: paymentIntent.id,
              paymentIntentId: paymentIntent.id,
              amount: paymentIntent.amount / 100,
              paymentMethod: "stripe",
            });
        } else {
          setError("Payment confirmation failed");
          onError && onError(new Error("Payment confirmation failed"));
        }
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError("Payment processing failed");
      onError && onError(err);
      toast.error("Payment processing failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setBillingDetails((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setBillingDetails((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#9e2146",
      },
    },
  };

  if (!clientSecret) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Initializing payment...
        </Typography>
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Payment Details
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={billingDetails.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={billingDetails.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={billingDetails.address.line1}
                onChange={(e) =>
                  handleInputChange("address.line1", e.target.value)
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                value={billingDetails.address.city}
                onChange={(e) =>
                  handleInputChange("address.city", e.target.value)
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Postal Code"
                value={billingDetails.address.postal_code}
                onChange={(e) =>
                  handleInputChange("address.postal_code", e.target.value)
                }
                required
              />
            </Grid>
          </Grid>

          <Box
            sx={{ mb: 3, p: 2, border: "1px solid #e0e0e0", borderRadius: 1 }}
          >
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Card Information
            </Typography>
            <CardElement options={cardElementOptions} />
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={!stripe || processing}
            sx={{ mt: 2 }}
          >
            {processing ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Processing...
              </>
            ) : (
              `Pay ${currency} ${amount.toFixed(2)}`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const StripePayment = ({
  amount,
  currency = "USD",
  onSuccess,
  onError,
  customerData,
}) => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm
        amount={amount}
        currency={currency}
        onSuccess={onSuccess}
        onError={onError}
        customerData={customerData}
      />
    </Elements>
  );
};

export default StripePayment;
