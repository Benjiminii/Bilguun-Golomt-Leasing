import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Formik } from 'formik';
import Numeral from 'numeral';
import * as Yup from 'yup';
import Loader from 'components/loading/loader'
import toast from "@/components/global/toastMessage";

import { useGolomtLeasingRequest } from "actions/golomt";
import Cookies from 'js-cookie';

import occupation from "components/cart/GolomtJson/occupation.json";
import qualification from "components/cart/GolomtJson/qualification.json";
import maritalStatus from "components/cart/GolomtJson/maritalStatus.json";
import sector from "components/cart/GolomtJson/sector.json";
import subSector from "components/cart/GolomtJson/subSector.json";

import state from "components/cart/GolomtJson/state.json";
import city from "components/cart/GolomtJson/city.json";

import withAuth from 'hocs/withAuth';
import { useAuthState } from 'contexts/auth';
import useSWR from 'swr';
import { hydraFetcher } from 'actions/index';
import Footer from '@/components/global/footer'
import Link from 'next/link'

const APLHABET = ["А", "Б", "В", "Г", "Д", "Е", "Ё", "Ж", "З", "И", "Й", "К", "Л", "М", "Н", "О", "Ө", "П", "Р", "С", "Т", "У", "Ү", "Ф", "Х", "Ц", "Ч", "Ш", "Щ", "Ъ", "Ь", "Э", "Ю", "Я"]

function GolomtLeasingForm() {
    const router = useRouter()
    const { interest, months, price, orderToken, paymentId, monthlyPayment } = router.query
    const [methodLoading, setMethodLoading] = useState(true)
    const [clickLoading, setClickLoading] = useState(false)
    const [lastLoanInfo, setLastLoanInfo] = useState()

    const { user: currentUser } = useAuthState()

    const [createGolomtLeasingRequest] = useGolomtLeasingRequest()
    const accessToken = Cookies.get('banana_token')

    const notify = useCallback((type, message, time) => {
        toast({ type, message, time })
    }, [])

    const { data, error } = useSWR(orderToken ? process.env.BASE_URL + "shop/orders/" + orderToken + "/items" : "", hydraFetcher)

    const products = data

    useEffect(() => {
        if (currentUser) {
            setMethodLoading(false)
            setLastLoanInfo(currentUser.golomtLoanUserInfo)
        }
    }, [currentUser])

    const handleForm = (values) => {
        let itemData = {
            data: {
                address: [{
                    country: "mnt",
                    type: "HOME",
                    state: values.state.toString(),
                    city: values.city.toString(),
                    subDistrict: values.subDistrict.toString(),
                    addressLine1: values.addressLine1.toString()
                }],
                loanInfo: {
                    amount: parseInt(price, 10),
                    prepaidAmt: parseInt(price * 0.01, 10),
                    period: parseInt(months, 10),
                    prodType: "LOAN",
                    prodCode: "LA294",
                    branchId: 110,
                    loanCrn: "MNT",
                    installmentType: "M",
                },
                customer: {
                    firstName: values.firstName.toString(),
                    lastName: values.lastName.toString(),
                    registerNo: (values.registerNoChar1 + values.registerNoChar2 + values.registerNoNumber).toString().toLowerCase()
                },
                demographic: {
                    appointment: values.appointment.toString(),
                    sector: values.sector.toString(),
                    subSector: values.subSector.toString(),
                    degree: values.degree.toString(),
                    maritalStatus: values.maritalStatus.toString(),
                    startDate: values.startDate.toString(),
                    yearsWork: parseInt(values.yearsWork, 10),
                },
                agreements: {
                    zmsFlg: "Y",
                    danFlg: "Y",
                },
                thirdPartyInfo: {
                    corpId: "C000031672",
                    corpAccountId: "2015123621",
                    corpAccountName: "Дижитал молл ХХК",
                },
                contact: [{
                    type: "PHONE",
                    subType: "CELLPH",
                    phone: values.phone.toString(),
                    countryCode: "976"
                }, {
                    type: "EMAIL",
                    subType: "HOMEEML",
                    email: values.email
                }],
                callbackUrl: `https://api.sylius.bananamall.mn/new-api/shop/golomt/loan/scoring/callback`,
            }
        }
        setClickLoading(true)
        createGolomtLeasingRequest(itemData, accessToken, orderToken)
            .then((res) => {
                if (res?.data?.url) {
                    router.push(res.data.url)
                }
                else {
                    setClickLoading(false)
                    notify('error', 'Алдаа гарлаа')
                }
            })
            .catch((err) => {
                let error = JSON.parse(err.response)
                console.log(error)
                setClickLoading(false)
                notify('error', 'Алдаа гарлаа')
            })
    }

    const onlyCapitalizeFirstLetter = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
    }

    return (
        <div className='wrap'>
            <header className="top-container only-logo">
                <div className="container">
                    <div className="top-section d-flex align-items-center justify-content-between">
                        <Link href="/">
                            <a className="logo me-auto">
                                <img src="/static/images/logo.svg" alt="Banana logo" />
                            </a>
                        </Link>
                    </div>
                </div>
            </header>

            <section className="cart-container">
                <div className="container">
                    <ul className="list-unstyled d-flex align-items-start justify-content-center leasing-steps">
                        <li className="done">
                            <span>1</span>
                            <strong>Төрөл сонгох</strong>
                        </li>
                        <li className="active">
                            <span>2</span>
                            <strong>Баталгаажуулалт</strong>
                        </li>
                        <li>
                            <span>3</span>
                            <strong>Хүсэлт илгээх</strong>
                        </li>
                        <li>
                            <span>4</span>
                            <strong>Зээл баталгаажуулах</strong>
                        </li>
                    </ul>
                    {
                        methodLoading ? (
                            null
                        ) : (
                            <Formik
                                initialValues={{
                                    firstName: lastLoanInfo ? lastLoanInfo.customer.firstName : "",
                                    lastName: lastLoanInfo ? lastLoanInfo.customer.lastName : "",
                                    phone: lastLoanInfo ? lastLoanInfo.contact[0].phone : "",
                                    email: lastLoanInfo ? lastLoanInfo.contact[1].email : "",
                                    registerNoChar1: lastLoanInfo ? lastLoanInfo.customer.registerNo.charAt(0) : "А",
                                    registerNoChar2: lastLoanInfo ? lastLoanInfo.customer.registerNo.charAt(1) : "А",
                                    registerNoNumber: lastLoanInfo ? lastLoanInfo.customer.registerNo.substring(2) : "",
                                    degree: lastLoanInfo ? lastLoanInfo.demographic.degree : "",
                                    appointment: lastLoanInfo ? lastLoanInfo.demographic.appointment : "",
                                    sector: lastLoanInfo ? lastLoanInfo.demographic.sector : "",
                                    subSector: lastLoanInfo ? lastLoanInfo.demographic.subSector : "",
                                    maritalStatus: lastLoanInfo ? lastLoanInfo.demographic.maritalStatus : "",
                                    startDate: lastLoanInfo ? lastLoanInfo.demographic.startDate : "",
                                    yearsWork: lastLoanInfo ? lastLoanInfo.demographic.yearsWork : null,
                                    state: "УБ",
                                    city: lastLoanInfo ? lastLoanInfo.address[0].city : "",
                                    subDistrict: lastLoanInfo ? lastLoanInfo.address[0].subDistrict : "",
                                    addressLine1: lastLoanInfo ? lastLoanInfo.address[0].addressLine1 : "",
                                }}
                                validationSchema={Yup.object().shape({
                                    firstName: Yup.string()
                                        .min(2, 'Нэр богино байна')
                                        .required('Нэрээ оруулна уу'),
                                    lastName: Yup.string()
                                        .min(2, 'Овог богино байна')
                                        .required('Овгоо оруулна уу'),
                                    phone: Yup.number()
                                        .min(10000000, 'Утасны дугаар богино байна')
                                        .max(99999999, 'Утасны дугаар урт байна')
                                        .required('Та утасны дугаараа оруулна уу'),
                                    email: Yup.string()
                                        .email("Зөв email оруулна уу")
                                        .required('Email-ээ оруулна уу'),
                                    registerNoChar1: Yup.string()
                                        .required(''),
                                    registerNoChar2: Yup.string()
                                        .required(''),
                                    registerNoNumber: Yup.string()
                                        .min(8, 'Регистрийн дугаараа зөв оруулна уу')
                                        .max(8, 'Регистрийн дугаараа зөв оруулна уу')
                                        .required('Регистрийн дугаараа оруулна уу'),
                                    degree: Yup.string()
                                        .notOneOf([("404")], "Боловсролын зэргээ оруулна уу")
                                        .required('Боловсролын зэргээ оруулна уу'),
                                    appointment: Yup.string()
                                        .notOneOf([("404")], "Албан тушаалаа оруулна уу")
                                        .required('Албан тушаалаа оруулна уу'),
                                    sector: Yup.string()
                                        .notOneOf([("404")], "Албан тушаалаа оруулна уу")
                                        .required('Ажлын секторээ оруулна уу'),
                                    subSector: Yup.string()
                                        .notOneOf([("404")], "Ажлын дэд секторээ оруулна уу")
                                        .required('Ажлын дэд секторээ оруулна уу'),
                                    maritalStatus: Yup.string()
                                        .notOneOf([("404")], "Гэрлэлтийн байдалаа оруулна уу")
                                        .required('Гэрлэлтийн байдалаа оруулна уу'),
                                    startDate: Yup.string()
                                        .required('Ажилд орсон огноогоо оруулна уу'),
                                    yearsWork: Yup.number()
                                        .min(1, '1-ээс их байх ёстой')
                                        .required('Нийт хөдөлмөр эрхэлсэн жилээ оруулна уу'),
                                    state: Yup.string()
                                        .notOneOf([("404")], "Бүсчлэлээ оруулна уу")
                                        .required('Бүсчлэлээ оруулна уу'),
                                    city: Yup.string()
                                        .notOneOf([("404")], "Дүүргээ оруулна уу")
                                        .required('Дүүргээ оруулна уу'),
                                    subDistrict: Yup.string().required('Хороогоо оруулна уу'),
                                    addressLine1: Yup.string().required('Хаягийн дэлгэрэнгүйг оруулна уу'),
                                })}
                                onSubmit={(values) => handleForm(values)}
                            >
                                {({
                                    handleChange,
                                    handleBlur,
                                    handleSubmit,
                                    touched,
                                    values,
                                    errors,
                                    setFieldValue,
                                }) => (
                                    <>
                                        <div className="row">
                                            <div className="col-lg-8">
                                                <div className="leasing-form-container white-bg p-3 pb-1 p-lg-4 mb-3 mb-lg-4">
                                                    <h2>
                                                        Зээлийн анкет
                                                    </h2>
                                                    <hr />
                                                    <h3 className="mb-2 mt-3 mt-sm-0">Хувийн мэдээлэл</h3>
                                                    <div className="row">
                                                        <div className="col-sm-6">
                                                            <div className="mb-3">
                                                                <label htmlFor="exampleInputEmail1" className="form-label must-valid">Нэр</label>
                                                                <input
                                                                    type="text"
                                                                    className={`form-control ${errors.firstName && touched.firstName
                                                                        ? 'is-invalid'
                                                                        : 'must-valid'
                                                                        }`}
                                                                    id="exampleInputEmail1"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    placeholder="Кирилл үсгээр бичнэ үү"
                                                                    value={values.firstName || ""}
                                                                    name="firstName"
                                                                />
                                                                {errors.firstName && touched.firstName && (
                                                                    <div
                                                                        id="validationServer04Feedback"
                                                                        className="invalid-feedback"
                                                                    >
                                                                        {errors.firstName}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="col-sm-6">
                                                            <div className="mb-3">
                                                                <label htmlFor="exampleInputEmail1" className="form-label must-valid">Овог</label>
                                                                <input
                                                                    type="text"
                                                                    className={`form-control ${errors.lastName && touched.lastName
                                                                        ? 'is-invalid'
                                                                        : 'must-valid'
                                                                        }`}
                                                                    id="exampleInputEmail1"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    placeholder="Кирилл үсгээр бичнэ үү"
                                                                    value={values.lastName || ""}
                                                                    name="lastName"
                                                                />
                                                                {errors.lastName && touched.lastName && (
                                                                    <div
                                                                        id="validationServer04Feedback"
                                                                        className="invalid-feedback"
                                                                    >
                                                                        {errors.lastName}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="col-sm-6">
                                                            <div className="mb-3">
                                                                <label htmlFor="exampleInputEmail1" className="form-label must-valid">Утасны дугаар</label>
                                                                <input
                                                                    type="number"
                                                                    className={`form-control ${errors.phone && touched.phone
                                                                        ? 'is-invalid'
                                                                        : 'must-valid'
                                                                        }`}
                                                                    id="exampleInputEmail1"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.phone || ""}
                                                                    name="phone"
                                                                />
                                                                {errors.phone && touched.phone && (
                                                                    <div
                                                                        id="validationServer04Feedback"
                                                                        className="invalid-feedback"
                                                                    >
                                                                        {errors.phone}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="col-sm-6">
                                                            <div className="mb-3">
                                                                <label htmlFor="exampleInputEmail1" className="form-label must-valid">Имэйл</label>
                                                                <input
                                                                    type="email"
                                                                    className={`form-control ${errors.email && touched.email
                                                                        ? 'is-invalid'
                                                                        : 'must-valid'
                                                                        }`}
                                                                    id="exampleInputEmail1"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.email || ""}
                                                                    name="email"
                                                                />
                                                                {errors.email && touched.email && (
                                                                    <div
                                                                        id="validationServer04Feedback"
                                                                        className="invalid-feedback"
                                                                    >
                                                                        {errors.email}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="col-sm-6">
                                                            <div className="mb-3">
                                                                <label htmlFor="exampleInputEmail1" className="form-label must-valid">Регистрийн дугаар</label>
                                                                <div className="input-group">
                                                                    <select
                                                                        className={`form-select ${errors.registerNoChar1 ? 'is-invalid' : 'must-valid'}`}
                                                                        aria-label="Default select example"
                                                                        onChange={handleChange}
                                                                        onBlur={handleBlur}
                                                                        name="registerNoChar1"
                                                                        value={values.registerNoChar1.toUpperCase()}
                                                                    >
                                                                        {
                                                                            APLHABET.map((i, index) => {
                                                                                return (
                                                                                    <option key={index} >{i}</option>
                                                                                )
                                                                            })
                                                                        }
                                                                    </select>
                                                                    <select
                                                                        className={`form-select ${errors.method ? 'is-invalid' : 'must-valid'}`}
                                                                        aria-label="Default select example"
                                                                        onChange={handleChange}
                                                                        onBlur={handleBlur}
                                                                        name="registerNoChar2"
                                                                        value={values.registerNoChar2.toUpperCase()}
                                                                    >
                                                                        {
                                                                            APLHABET.map((i, index) => {
                                                                                return (
                                                                                    <option key={index}>{i}</option>
                                                                                )
                                                                            })
                                                                        }
                                                                    </select>
                                                                    <input
                                                                        type="text"
                                                                        className={`form-control w-50 ${errors.registerNoNumber && touched.registerNoNumber
                                                                            ? 'is-invalid'
                                                                            : 'must-valid'
                                                                            }`}
                                                                        placeholder=""
                                                                        aria-label="Example text with two button addons"
                                                                        onChange={handleChange}
                                                                        onBlur={handleBlur}
                                                                        value={values.registerNoNumber || ""}
                                                                        name="registerNoNumber"
                                                                    />
                                                                    {errors.registerNoNumber && touched.registerNoNumber && (
                                                                        <div
                                                                            id="validationServer04Feedback"
                                                                            className="invalid-feedback"
                                                                        >
                                                                            {errors.registerNoNumber}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <hr />
                                                    <h3 className="mb-2 mt-3 mt-sm-0">Нэмэлт мэдээлэл</h3>
                                                    <div className="row">
                                                        <div className="col-sm-6">
                                                            <div className="mb-3">
                                                                <label htmlFor="exampleInputEmail1" className="form-label must-valid">Боловсрол</label>
                                                                <select
                                                                    className={`form-select ${errors.degree ? 'is-invalid' : 'must-valid'}`}
                                                                    aria-label="Default select example"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    name="degree"
                                                                    value={values.degree || ""}
                                                                >
                                                                    {
                                                                        qualification.map((i, index) => {
                                                                            return (
                                                                                <option
                                                                                    key={index}
                                                                                    value={i.code}
                                                                                >
                                                                                    {onlyCapitalizeFirstLetter(i.description)}
                                                                                </option>
                                                                            )
                                                                        })
                                                                    }
                                                                </select>
                                                                {errors.degree && touched.degree && (
                                                                    <div
                                                                        id="validationServer04Feedback"
                                                                        className="invalid-feedback"
                                                                    >
                                                                        {errors.degree}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="col-sm-6">
                                                            <div className="mb-3">
                                                                <label htmlFor="exampleInputEmail1" className="form-label must-valid">Албан тушаал</label>
                                                                <select
                                                                    className={`form-select ${errors.appointment ? 'is-invalid' : 'must-valid'}`}
                                                                    aria-label="Default select example"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    name="appointment"
                                                                    value={values.appointment || ""}
                                                                >
                                                                    {
                                                                        occupation.map((i, index) => {
                                                                            return (
                                                                                <option
                                                                                    key={index}
                                                                                    value={i.code}
                                                                                >
                                                                                    {onlyCapitalizeFirstLetter(i.description)}
                                                                                </option>
                                                                            )
                                                                        })

                                                                    }
                                                                </select>
                                                                {errors.appointment && touched.appointment && (
                                                                    <div
                                                                        id="validationServer04Feedback"
                                                                        className="invalid-feedback"
                                                                    >
                                                                        {errors.appointment}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="col-sm-6">
                                                            <div className="mb-3">
                                                                <label htmlFor="exampleInputEmail1" className="form-label must-valid">Ажлын сектор</label>
                                                                <select
                                                                    className={`form-select ${errors.sector ? 'is-invalid' : 'must-valid'}`}
                                                                    aria-label="Default select example"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    name="sector"
                                                                    value={values.sector || ""}
                                                                >
                                                                    {
                                                                        sector.map((i, index) => {
                                                                            return (
                                                                                <option
                                                                                    key={index}
                                                                                    value={i.code}
                                                                                >
                                                                                    {onlyCapitalizeFirstLetter(i.description)}
                                                                                </option>
                                                                            )
                                                                        })
                                                                    }
                                                                </select>
                                                                {errors.sector && touched.sector && (
                                                                    <div
                                                                        id="validationServer04Feedback"
                                                                        className="invalid-feedback"
                                                                    >
                                                                        {errors.sector}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="col-sm-6">
                                                            <div className="mb-3">
                                                                <label htmlFor="exampleInputEmail1" className="form-label must-valid">Ажлын дэд сектор</label>
                                                                <select
                                                                    className={`form-select ${errors.subSector ? 'is-invalid' : 'must-valid'}`}
                                                                    aria-label="Default select example"
                                                                    label="text"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    name="subSector"
                                                                    value={values.subSector || ""}
                                                                >
                                                                    {
                                                                        subSector.map((i, index) => {
                                                                            return (
                                                                                <option
                                                                                    key={index}
                                                                                    value={i.code}
                                                                                >
                                                                                    {onlyCapitalizeFirstLetter(i.description)}
                                                                                </option>
                                                                            )
                                                                        })
                                                                    }
                                                                </select>
                                                                {errors.subSector && touched.subSector && (
                                                                    <div
                                                                        id="validationServer04Feedback"
                                                                        className="invalid-feedback"
                                                                    >
                                                                        {errors.subSector}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="col-sm-6">
                                                            <div className="mb-3">
                                                                <label htmlFor="exampleInputEmail1" className="form-label must-valid">Гэрлэлтийн байдал</label>
                                                                <select
                                                                    className={`form-select ${errors.maritalStatus ? 'is-invalid' : 'must-valid'}`}
                                                                    aria-label="Default select example"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    name="maritalStatus"
                                                                    value={values.maritalStatus || ""}
                                                                >
                                                                    {
                                                                        maritalStatus.map((i, index) => {
                                                                            return (
                                                                                <option
                                                                                    key={index}
                                                                                    value={i.code}
                                                                                >
                                                                                    {onlyCapitalizeFirstLetter(i.description)}
                                                                                </option>
                                                                            )
                                                                        })
                                                                    }
                                                                </select>
                                                                {errors.maritalStatus && touched.maritalStatus && (
                                                                    <div
                                                                        id="validationServer04Feedback"
                                                                        className="invalid-feedback"
                                                                    >
                                                                        {errors.maritalStatus}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="col-sm-6">
                                                            <div className="mb-3">
                                                                <label htmlFor="exampleInputEmail1" className="form-label must-valid">Ажилд орсон огноо</label>
                                                                <input
                                                                    type="date"
                                                                    className={`form-control ${errors.startDate && touched.startDate
                                                                        ? 'is-invalid'
                                                                        : 'must-valid'
                                                                        }`}
                                                                    id="exampleInputEmail1"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    defaultValue={values.startDate || ""}
                                                                    name="startDate"
                                                                />
                                                                {errors.startDate && touched.startDate && (
                                                                    <div
                                                                        id="validationServer04Feedback"
                                                                        className="invalid-feedback"
                                                                    >
                                                                        {errors.startDate}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="col-sm-6">
                                                            <div className="mb-3">
                                                                <label htmlFor="exampleInputEmail1" className="form-label must-valid">Нийт хөдөлмөр эрхэлсэн жил</label>
                                                                <input
                                                                    type="text"
                                                                    className={`form-control ${errors.yearsWork && touched.yearsWork
                                                                        ? 'is-invalid'
                                                                        : 'must-valid'
                                                                        }`}
                                                                    id="exampleInputEmail1"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.yearsWork || ""}
                                                                    name="yearsWork"
                                                                />
                                                                {errors.yearsWork && touched.yearsWork && (
                                                                    <div
                                                                        id="validationServer04Feedback"
                                                                        className="invalid-feedback"
                                                                    >
                                                                        {errors.yearsWork}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <hr />
                                                    <h3 className="mb-2 mt-3 mt-sm-0">Оршин суугаа хаяг</h3>
                                                    {/* <div className="form-check">
                                            <input className="form-check-input" type="checkbox" value="" id="flexCheckDefault" onChange={handleChange}
                                                onBlur={handleBlur} />
                                            <label className="form-check-label" htmlFor="flexCheckDefault">
                                                Хүргүүлэх хаяг болон одоогийн оршин суугаа хаяг ижил
                                            </label>
                                        </div> */}
                                                    <div className="row">

                                                        {/* <div className="col-sm-6">
                                                <div className="mb-3">
                                                    <label htmlFor="exampleInputEmail1" className="form-label must-valid">Бүсчлэл</label>
                                                    <select
                                                        className={`form-select ${errors.state ? 'is-invalid' : 'must-valid'}`}
                                                        aria-label="Default select example"
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        value={values.state || ""}
                                                        name="state"
                                                    >
                                                        {
                                                            state.map((i, index) => {
                                                                return (
                                                                    <option value={i.code}>{i.name}</option>
                                                                )
                                                            })
                                                        }
                                                    </select>
                                                    {errors.state && touched.state && (
                                                        <div
                                                            id="validationServer04Feedback"
                                                            className="invalid-feedback"
                                                        >
                                                            {errors.state}
                                                        </div>
                                                    )}
                                                </div>
                                            </div> */}

                                                        <div className="col-sm-6">
                                                            <div className="mb-3">
                                                                <label htmlFor="exampleInputEmail1" className="form-label must-valid">Бүсчлэл</label>
                                                                <input
                                                                    type="text"
                                                                    className={`form-control`}
                                                                    id="exampleInputEmail1"
                                                                    value={"Улаанбаатар" || ""}
                                                                    name="yearsWork"
                                                                    disabled
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="col-sm-6">
                                                            <div className="mb-3">
                                                                <label htmlFor="exampleInputEmail1" className="form-label must-valid">Дүүрэг</label>
                                                                <select
                                                                    className={`form-select ${errors.city ? 'is-invalid' : 'must-valid'}`}
                                                                    aria-label="Default select example"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.city || ""}
                                                                    name="city"
                                                                >
                                                                    {
                                                                        city.map((i, index) => {
                                                                            return (
                                                                                <option key={index} value={i.code}>{onlyCapitalizeFirstLetter(i.name)}</option>
                                                                            )
                                                                        })
                                                                    }
                                                                </select>
                                                                {errors.city && touched.city && (
                                                                    <div
                                                                        id="validationServer04Feedback"
                                                                        className="invalid-feedback"
                                                                    >
                                                                        {errors.city}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div >
                                                    <div className="mb-3">
                                                        <label htmlFor="exampleFormControlTextarea1" className="form-label must-valid">Хороо</label>
                                                        <textarea
                                                            className={`form-control ${errors.subDistrict && touched.subDistrict
                                                                ? 'is-invalid'
                                                                : 'must-valid'
                                                                }`}
                                                            id="exampleFormControlTextarea1"
                                                            rows="1"
                                                            onChange={handleChange}
                                                            name="subDistrict"
                                                            value={values.subDistrict || ""}
                                                        />
                                                        {
                                                            errors.subDistrict && touched.subDistrict && (
                                                                <div
                                                                    id="validationServer04Feedback"
                                                                    className="invalid-feedback"
                                                                >
                                                                    {errors.subDistrict}
                                                                </div>
                                                            )
                                                        }
                                                    </div >
                                                    <div className="mb-3">
                                                        <label htmlFor="exampleFormControlTextarea1" className="form-label must-valid">Хаягийн дэлгэрэнгүй</label>
                                                        <textarea
                                                            className={`form-control ${errors.addressLine1 && touched.addressLine1
                                                                ? 'is-invalid'
                                                                : 'must-valid'
                                                                }`}
                                                            id="exampleFormControlTextarea1"
                                                            rows="3"
                                                            onChange={handleChange}
                                                            name="addressLine1"
                                                            value={values.addressLine1}
                                                        />
                                                        {errors.addressLine1 && touched.addressLine1 && (
                                                            <div
                                                                id="validationServer04Feedback"
                                                                className="invalid-feedback"
                                                            >
                                                                {errors.addressLine1}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div >
                                            </div >

                                            <div className="col-lg-4">
                                                <div className="leasing-confirm white-bg p-3 pb-1 p-lg-4 mb-3 mb-lg-4">
                                                    {
                                                        products?.map((product, index) => {
                                                            let name
                                                            let variantName
                                                            name = product?.variant?.product?.name
                                                            variantName = product?.variant?.name
                                                            return (
                                                                <div className="single d-flex align-items-start" key={index}>
                                                                    <img src={product?.variant?.product.images[0].productPngThumbnail} alt="" className="image flex-shrink-0" />
                                                                    <div className="product-info d-flex flex-column">
                                                                        <Link href={`/product/${product.product.slug}`}>
                                                                            <a className="name">
                                                                                {name} - {variantName}
                                                                            </a>
                                                                        </Link>
                                                                        <div className="price">
                                                                            <strong>{Numeral(product?.discountedUnitPrice ? product.discountedUnitPrice : price).format('0,0') + '₮'}</strong>
                                                                            <strong>{" x " + product.quantity}</strong>
                                                                        </div >
                                                                    </div >
                                                                </div >
                                                            )
                                                        })
                                                    }
                                                    <ul className="list-unstyled monthly d-flex align-items-center justify-content-between flex-wrap">
                                                        <li>
                                                            <span>Зээлийн хэмжээ: </span>
                                                            <strong>{Numeral(Math.round(price * 1.0)).format('0,0') + '₮'}</strong>
                                                        </li>
                                                        <li>
                                                            <span>Шимтгэл: </span>
                                                            <strong>{Numeral(Math.round(price * 0.01)).format('0,0') + '₮'}</strong>
                                                        </li >
                                                        <li>
                                                            <span>Хүү: </span>
                                                            <strong>{interest}%</strong>
                                                        </li>
                                                        <li>
                                                            <span>Хугацаа: </span>
                                                            <strong>{months} сар</strong>
                                                        </li>
                                                        <li>
                                                            <span>Сард төлөх: </span>
                                                            <strong>{Numeral(monthlyPayment).format('0,0')}₮</strong>
                                                        </li>
                                                        <li>
                                                            <span>Нийт дүн: </span>
                                                            <strong>{Numeral(price * 1.01).format('0,0')}₮</strong>
                                                        </li>
                                                    </ul >

                                                    <div className="d-flex align-items-center justify-content-center">
                                                        <button type="button" className="btn btn-sec w-50" onClick={() => router.back()}>Буцах</button>
                                                        <button type="button" className="btn btn-main ms-3 w-50" onClick={() => handleSubmit()}>
                                                            <span>Хүсэлт илгээх</span>
                                                        </button>
                                                    </div>
                                                    <div className="instruction">
                                                        {/* <p>Таны зээлийн хүсэлт илгээгдсэнээс хойш 1-10 минутад хүсэлтийн хариу гарна.</p>
                                            <p>Зээлийн хүсэлт баталгаажсанаас хойш захиалга баталгаажуулах процесс явахдах болно.</p> */}
                                                        <p>Таны зээлийн хүсэлт илгээгдсэнээс хойш 1-10 минутад хүсэлтийн хариу гарна.</p>
                                                        <p>Зээлийн хүсэлт баталгаажсанаас хойш захиалга баталгаажуулах процесс явагдах болно.</p>
                                                    </div >
                                                </div >
                                            </div >
                                        </div >
                                    </>
                                )
                                }
                            </Formik >
                        )
                    }
                </div >
                {clickLoading && <Loader />}
            </section>
            <Footer />
        </div>
    )
}

export default withAuth(GolomtLeasingForm);

