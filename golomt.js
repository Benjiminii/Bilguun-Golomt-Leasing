import axios from 'axios'
import { useApiHandler, hydraFetcher, useApiHandlerHydra } from 'actions'

const createGolomtLeasingRequest = (data, accessToken, orderToken) =>
    axios.post(
        `${process.env.BASE_URL}shop/orders/${orderToken}/golomt/loan-request`,
        data,
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: accessToken ? `Bearer ${accessToken}` : null,
            }
        }
    )

const getGolomtLeasingVerify = (data, accessToken, orderToken) =>
    axios.post(
        `${process.env.BASE_URL}shop/orders/${orderToken}/golomt/loan-request/verify`,
        data,
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: accessToken ? `Bearer ${accessToken}` : null,
            }
        }
    )

const getGolomtLeasingStatus = (accessToken, orderToken) =>
    axios.post(
        `${process.env.BASE_URL}shop/orders/${orderToken}/golomt/loan-status`,
        null,
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: accessToken ? `Bearer ${accessToken}` : null,
            }
        }
    )

const createGolomtLeasingOTP = (data, accessToken) =>
    axios.post(
        `${process.env.BASE_URL}shop/golomt/auth/authorize/otp/send`,
        data,
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: accessToken ? `Bearer ${accessToken}` : null,
            }
        }
    )

const checkGolomtLeasingOTP = (data, accessToken) =>
    axios.post(
        `${process.env.BASE_URL}shop/golomt/auth/authorize/otp`,
        data,
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: accessToken ? `Bearer ${accessToken}` : null,
            }
        }
    )

const createGolomtLeasingConfirm = (data, accessToken, orderToken) =>
    axios.post(
        `${process.env.BASE_URL}shop/orders/${orderToken}/golomt/loan/confirm`,
        data,
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: accessToken ? `Bearer ${accessToken}` : null,
            }
        }
    )

const createGolomtLeasingStepsDone = (accessToken, orderToken) =>
    axios.put(
        `${process.env.BASE_URL}shop/orders/${orderToken}/payment-status/golomt/loan`,
        null,
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: accessToken ? `Bearer ${accessToken}` : null,
            }
        }
    )

const getGolomtLeasingPDF = (data, accessToken) =>
    axios.post(
        `${process.env.BASE_URL}shop/golomt/loan/contract`,
        data,
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: accessToken ? `Bearer ${accessToken}` : null,
            },
            responseType: 'blob'
        }
    )

export const useGolomtLeasingRequest = () => useApiHandler(createGolomtLeasingRequest)
export const useGolomtLeasingVerify = () => useApiHandler(getGolomtLeasingVerify)
export const useGolomtLeasingStatus = () => useApiHandler(getGolomtLeasingStatus)
export const useGolomtLeasingOTP = () => useApiHandler(createGolomtLeasingOTP)
export const useCheckGolomtLeasingOTP = () => useApiHandler(checkGolomtLeasingOTP)
export const useGolomtLeasingConfirm = () => useApiHandler(createGolomtLeasingConfirm)
export const useGolomtLeasingStepsDone = () => useApiHandler(createGolomtLeasingStepsDone)
export const useGolomtLeasingPDF = () => useApiHandler(getGolomtLeasingPDF)
