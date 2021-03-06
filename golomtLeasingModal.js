import { useState, useEffect } from "react";
import { useGolomtLeasingOTP, useCheckGolomtLeasingOTP, useGolomtLeasingConfirm, useGolomtLeasingStepsDone } from "actions/golomt";
import Numeral from 'numeral';
import Image from 'next/image';
import { MdInfo } from 'react-icons/md'
import OrderApi from 'lib/api/orders'
import { isMobile } from 'react-device-detect'

let countdown
function GolomtLeasingModal({
    golomtModal,
    handleClose,
    golomtLevel,
    orderToken,
    accessToken,
    loanScoringStatus,
    price,
    success,
    setSuccess,
    otp,
    setOtp,
    selectedMonth,
    setSelectedMonth,
    statusData,
    bankAccount,
    setBankAccount,
    golomtLoanUserInfo,
    isGolomtCustomer,
    scopeAndState,
    setScopeAndState,
    notify,
    interest,
    phone,
    setPhone,
    orderId,
    pdfLoader,
    setPdfLoader,
    pdfFile
}) {
    const [addressChecked, setAddressChecked] = useState(false)
    const [showContract, setShowContract] = useState(false)
    const [acceptedContract, setAcceptedContract] = useState(false)
    const [inOTP, setInOTP] = useState(false)

    const [createGolomtLeasingOTP] = useGolomtLeasingOTP()
    const [checkGolomtLeasingOTP] = useCheckGolomtLeasingOTP()
    const [createGolomtLeasingConfirm] = useGolomtLeasingConfirm()
    const [createGolomtLeasingStepsDone] = useGolomtLeasingStepsDone()

    const [methodLoading, setMethodLoading] = useState(false)
    const [secondLoader, setSecondLoader] = useState(false)

    const [minute, setMinute] = useState(1)
    const [second, setSecond] = useState(0)

    let time = 60

    function update() {
        let min = Math.floor(time / 60);
        let sec = time % 60;
        sec = sec < 10 ? '0' + sec : sec;
        time--
        setMinute(min)
        setSecond(sec)
        min == 0 && sec == 0 ? clearInterval(countdown) : countdown;
    }

    useEffect(() => {
        if (scopeAndState && methodLoading === true) {
            otpRequest()
        }
    }, [scopeAndState])

    async function ContractConfirm() {
        setMethodLoading(true)
        const orderJson = await new OrderApi(accessToken).getOrderDetail(orderToken)
        if (orderJson) {
            setMethodLoading(false)
            if (orderJson?.data?.isGolomtFee === false) {
                notify('error', '???? ?????????????? ?????????????????? ???????????????? ??????????.')
                setMethodLoading(false)
            }
            else {
                let data = {
                    approvedAmt: price,
                    newAcctFlg: addressChecked ? "Y" : "N",
                    creditAccount: addressChecked ? null : bankAccount,
                    creditAccountName: addressChecked ? null : golomtLoanUserInfo.customer.firstName,
                    payday: selectedMonth
                }
                createGolomtLeasingConfirm(data, accessToken, orderToken)
                    .then((res) => {
                        if (res.data) {
                            setScopeAndState(res.data)
                        }
                        if (res.errors) {
                            if (res.errors.creditAccount[0] === "creditAccount ???????????? ??????????")
                                notify('error', '???????????? ???????????????? ?????????????? ????')
                            else {
                                notify('error', '?????????? ????????????')
                            }
                        }
                    })
                    .catch((err) => {
                        setMethodLoading(false)
                        if (err.code === 3001) {
                            let error = JSON.parse(err.response)
                            console.log(error)
                            switch (error.message) {
                                case "application.already.confirmed":
                                case "Confirmation not accepted for this application":
                                    notify("error", "???? ?????????????? ???????????????? ?????????????????????????????? ??????????")
                                    break
                                case "Confirmation overdue":
                                    notify("error", "???????? ?????????????? ???????????????? ???????????????????????????? ?????????????? ???????????????? ??????????", 5000)
                                    break
                                case "Confirmation limit exceeded":
                                    notify("error", "???? ?????????????? ?????????????????? ???????????????????????????? ?????????????? ???????????????? ??????????", 5000)
                                    break
                                default:
                                    notify('error', '??????????????????',)
                                    break
                            }
                        }
                        else
                            notify('error', '??????????????????')
                    })
            }
        }
        else {
            notify('error', '?????????? ????????????')
            setMethodLoading(false)
        }
    }

    function otpRequest() {
        setInOTP(true)
        setMethodLoading(false)
        setSecondLoader(true)
        let data = scopeAndState
        createGolomtLeasingOTP(data, accessToken)
            .then((res) => {
                if (res.data.status === "success") {
                    setMinute(1)
                    setSecond(0)
                    countdown = setInterval(update, 1000)
                    setPhone(res.data.maskedPhone)
                    notify('success', '?????? ?????????????????? ????????????????????')
                }
                setMethodLoading(false)
                setSecondLoader(false)
            })
            .catch((err) => {
                setMinute(0)
                setSecond(0)
                setMethodLoading(false)
                setSecondLoader(false)
                if (err.code === 3001) {
                    let error = JSON.parse(err.response)
                    error.message && notify("error", error.message)
                }
                else
                    notify('error', '??????????????????')
            })
    }

    function otpVerification() {
        if (otp.length !== 6) {
            notify("info", "???????? ???????? ?????? ???????????????? ?????????? ?????????? ????")
        }
        else {
            setMethodLoading(true)
            let data = {
                otp: otp,
                redirectUri: `https://www.bananamall.mn/user/orders/${orderToken}`
            }
            checkGolomtLeasingOTP(data, accessToken)
                .then((res) => {
                    if (res.data.status === "SUCCESS")
                        loanRequestConfirm()
                    else {
                        notify('error', '??????????????????')
                        setMethodLoading(false)
                    }
                })
                .catch((err) => {
                    if (err.code === 3001) {
                        let error = JSON.parse(err.response)
                        console.log(error)
                        if (error.message) notify("error", error.message)
                    }
                    else
                        notify('error', '??????????????????')
                    setMethodLoading(false)
                })
        }
    }
    function loanRequestConfirm() {
        let data = {
            approvedAmt: statusData?.amount,
            newAcctFlg: addressChecked ? "Y" : "N",
            creditAccount: addressChecked ? null : bankAccount,
            creditAccountName: addressChecked ? null : golomtLoanUserInfo.customer.firstName,
            payday: selectedMonth,
            authData: {
                state: scopeAndState?.state,
                scope: scopeAndState?.scope,
            }
        }
        createGolomtLeasingConfirm(data, accessToken, orderToken)
            .then((res) => {
                if (res.data.status === "SUCCESS") {
                    notify('success', '???????? ?????????????? ???????????? ????????????????????????')
                    setSuccess(true)
                    setMethodLoading(false)
                }
            })
            .catch((err) => {
                setMethodLoading(false)
                let error = JSON.parse(err.response)
                if (error.message === "Scheme code not valid") notify("error", "???? ???????????????? ?????????????? ??????????. ???????????? ???????????? ???????????? ?????????????? ????")
                else notify('error', '?????????? ????????????')
                console.log(error)
            })
    }
    useEffect(() => {
        if (success === true) {
            createGolomtLeasingStepsDone(accessToken, orderToken)
                .then((res) => {
                    console.log(res)
                })
                .catch((err) => {
                    console.log(err)
                    setMethodLoading(false)
                })
        }
    }, [success])

    return (
        <div
            className={`modal fade leasing-modal ${golomtModal && 'show'}`}
            id="leasingModal"
            tabIndex="-1"
            aria-labelledby="leasingModal"
            aria-hidden="true"
            onClick={() => handleClose()}
            style={{
                display: golomtModal ? "block" : "none",
                padding: "0.5rem",
                background: golomtModal ? "rgb(0, 0, 0, 0.5)" : "",
            }}
        >
            <div className="modal-dialog modal-lg">
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <div className="modal-body">
                        <h1 className="d-flex align-items-center">
                            <img src="/static/images/payment-logos/golomt-loan.png" alt="" className="image" />
                            <strong>???????????? ?????????????? ?????????????????? ???????????????? ?????????????? ????????</strong>
                            <button type="button" className="btn-close ms-auto" data-bs-dismiss="modal" aria-label="Close" onClick={() => handleClose()}>
                                <img src="/static/images/icons/times.svg" alt="" className="svg-icon" />
                            </button>
                        </h1>
                        <ul className="list-unstyled d-flex align-items-start justify-content-center leasing-steps">
                            <li className="done">
                                <span>1</span>
                                <strong>?????????? ????????????</strong>
                            </li>
                            <li className="done">
                                <span>2</span>
                                <strong>??????????????????????????????</strong>
                            </li>
                            <li className="done">
                                <span>3</span>
                                <strong>???????????? ????????????</strong>
                            </li>
                            <li className={`${success === true ? "done" : "active"}`}>
                                <span>4</span>
                                <strong>???????? ????????????????????????????</strong>
                            </li>
                        </ul>
                        {
                            isGolomtCustomer ? (
                                <div>
                                    {
                                        golomtLevel === 1 && (
                                            <div>
                                                <div className="leasing-message">
                                                    <h4>
                                                        <strong>???????? ?????????????? ???????????? ?????????????????? ????????????????????.</strong>
                                                        <span>
                                                            ?????????????????? ?????????? 1-10 ?????????????? ?????????? ???? ?????? ???????? ???????????????????? ???????????? ???????????? ?????? ?????????????????? ???????????????? ??????????.
                                                            ?????? ?????????????????? ???????????? ????????????????????? ????????????????????????? ?????????????? ?????????? ?????????? ?????????????? ???????? ?????????? ??????????????????.
                                                        </span>
                                                    </h4>
                                                    <span style={{ fontWeight: 500, fontSize: "1rem" }}>
                                                        ???????????? ???????????? ?????? ?????????????????????? ?????????????? ???????????? ?????????????????????????? ?????? ???????? ?????? ???????????? ???????????? ?????????????? ???????? 1 ???????? ???????????????????????? ?????????? ???????? ????????????????????????.
                                                    </span>
                                                </div>
                                                <div className="instruction">
                                                    <p className="text-center">
                                                        <strong>????????????: </strong>
                                                        ?????????????? ?????????? ???????????????????????? ?????? ?????? ???????????????????? ???????????? ???????????? ??????????, ?????????????? ???????????????????? ???????? ?????????????????? ???????????? ???????????? ???????????????? ????.
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    }
                                    {
                                        (golomtLevel === 2 || golomtLevel === 3) && !inOTP && !success && (
                                            <div>
                                                {
                                                    loanScoringStatus === "SUCCESS" && (
                                                        <div className="leasing-status">
                                                            <div className="monthly">
                                                                <h5 className="mb-3">?????????????? ???????????? ??????????????????????????</h5>
                                                                <ul className="list-unstyled d-flex align-items-center flex-column flex-wrap">
                                                                    <li>
                                                                        <span>???????? ??????:</span>
                                                                        <strong>{Numeral(statusData?.amount + statusData?.chrgAmt).format('0,0')}???</strong>
                                                                    </li>
                                                                    <li>
                                                                        <span>?????????????? ??????????????:</span>
                                                                        <strong>{Numeral(statusData?.chrgAmt).format('0,0')}???</strong>
                                                                    </li>
                                                                    <li>
                                                                        <span>?????????????? ??????:</span>
                                                                        <strong>{interest}%</strong>
                                                                    </li>
                                                                    <li>
                                                                        <span>?????????????? ????????????:</span>
                                                                        <strong>{Numeral(statusData?.amount).format('0,0')}???</strong>
                                                                    </li>
                                                                    <li>
                                                                        <span>??????????????:</span>
                                                                        <strong>{statusData?.period} ??????</strong>
                                                                    </li>
                                                                    <li>
                                                                        <span>???????? ??????????:</span>
                                                                        <strong>{Numeral(statusData?.monthlyAmt).format('0,0')}???</strong>
                                                                    </li>
                                                                </ul>
                                                            </div>

                                                            <hr />

                                                            <div className="monthly">
                                                                <h5 className="mb-3">?????????????? ?????????????? ?????????? ???????????? ????????????????</h5>
                                                                <ul className="list-unstyled d-flex align-items-center flex-column flex-wrap">
                                                                    <li>
                                                                        <span>???????????? ????????:</span>
                                                                        <strong>2015135962</strong>
                                                                    </li>
                                                                    <li>
                                                                        <span>???????????? ??????????:</span>
                                                                        <strong>?????????????? ???????? ??????</strong>
                                                                    </li>
                                                                    <li>
                                                                        <span>?????????????????? ??????????????:</span>
                                                                        <strong>{Numeral(statusData?.chrgAmt).format('0,0')}???</strong>
                                                                    </li>
                                                                    <li>
                                                                        <span>???????????????????? ????????:</span>
                                                                        <strong>{parseInt(orderId)}</strong>
                                                                    </li>
                                                                </ul>
                                                                <div
                                                                    style={{
                                                                        padding: "1rem",
                                                                        display: "flex",
                                                                        borderColor: "rgb(255, 212, 79)",
                                                                        borderStyle: "solid",
                                                                        borderWidth: "2px",
                                                                        borderRadius: "10px",
                                                                        alignItems: "center",
                                                                        marginTop: "10px"
                                                                    }}
                                                                >
                                                                    <div
                                                                        style={{
                                                                            fontSize: 35,
                                                                            color: "rgb(255, 212, 79)",
                                                                        }}
                                                                    >
                                                                        <MdInfo />
                                                                    </div>
                                                                    <span
                                                                        style={{
                                                                            color: "rgba(56, 60, 74, 0.7)",
                                                                            textAlign: "center"
                                                                        }}
                                                                    >
                                                                        ???? ???????????????????? ?????????????? ?????????? ?????????? ???????? ?????????? ?????????????? ??????????????????????????
                                                                        ???? ???????????? ???????????????????????????? ?????????????????? ?????????????? ???????????????? ????.
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <hr />

                                                            <div className="select-monthly-payment">
                                                                <h5 className="mb-3">?????????????????? ?????????????? ????????????</h5>
                                                                <div className="tab-content" id="myTabContent">
                                                                    <div className="row row-cols-sm-2 align-items-end d-flex flex-wrap">
                                                                        <div className="mb-3" style={{ width: "fit-content" }}>
                                                                            <label htmlFor="exampleInputEmail1" className="form-label">
                                                                                ?????? ?????? ???????????? ?????????? ????????
                                                                            </label>
                                                                            <select
                                                                                style={{ minWidth: 0 }}
                                                                                className="form-select"
                                                                                onChange={(e) => setSelectedMonth(e.target.value)}
                                                                                value={selectedMonth}
                                                                            >
                                                                                <option value="1">1</option>
                                                                                <option value="5">5</option>
                                                                                <option value="25">25</option>
                                                                                <option value="30">30</option>
                                                                            </select>
                                                                        </div>
                                                                        <div style={{ flex: 1, minWidth: 300 }}>
                                                                            <label htmlFor="exampleInputEmail1" className="form-label">
                                                                                ???????????? ?????? ?????????? ???????? ?????????? ???????????? ???????????????? ?????????? ????.
                                                                            </label>
                                                                            <div className="input-group mb-3 flex-nowrap">
                                                                                <span
                                                                                    className="input-group-text"
                                                                                    style={{
                                                                                        color: "rgb(112, 105, 251, 1)",
                                                                                        backgroundColor: "rgb(112, 105, 251, 0.1)",
                                                                                    }}
                                                                                >
                                                                                    ???????????? ???????????? ????????????
                                                                                </span>
                                                                                <input
                                                                                    type="text"
                                                                                    className="form-control"
                                                                                    id="exampleInputEmail1"
                                                                                    aria-describedby="emailHelp"
                                                                                    disabled={addressChecked ? true : false}
                                                                                    onChange={(e) => setBankAccount(e.target.value)}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        <div className="form-check mb-3" style={{ paddingLeft: "0.75rem" }}>
                                                                            <input className="form-check-input" type="checkbox" value="" id="flexCheckDefault53" onClick={(e) => setAddressChecked(e.target.checked)} />
                                                                            <label className="form-check-label" htmlFor="flexCheckDefault53">
                                                                                ???????????? ???????????? ??????????????
                                                                            </label>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="policy-check d-flex align-items-center flex-column">
                                                                <h4 style={{ textAlign: "center" }}>???? ???????????? ?????????????????? ???????????????????????? ????????????, ?????????????? ?????????? ?????????? ???????????????? ???????????????? ???????????????? ???????? ???????????????????????? ????.</h4>
                                                                {
                                                                    showContract && (
                                                                        <div style={{ width: "100%", position: "relative" }}>
                                                                            {
                                                                                pdfLoader ? (
                                                                                    <div
                                                                                        style={{
                                                                                            height: isMobile ? 450 : 969,
                                                                                            width: "100%",
                                                                                            display: "flex",
                                                                                            background: "rgba(237, 237, 240, 1)",
                                                                                            justifyContent: "center",
                                                                                            alignItems: "center"
                                                                                        }}
                                                                                    >
                                                                                        <span
                                                                                            className="spinner-border"
                                                                                            role="status"
                                                                                            aria-hidden="true"
                                                                                        />
                                                                                    </div>
                                                                                ) : (
                                                                                    <div>
                                                                                        <iframe
                                                                                            src={`/pdfjs-2.12.313-dist/web/viewer.html?file=${pdfFile}`}
                                                                                            id="iframepdf"
                                                                                            width="100%"
                                                                                            scrolling="no"
                                                                                            height={isMobile ? "450" : "969"}
                                                                                        />
                                                                                        <a
                                                                                            href={pdfFile}
                                                                                            target="_blank"
                                                                                            style={{
                                                                                                position: "absolute",
                                                                                                top: 0,
                                                                                                left: 0,
                                                                                                display: "inline-block",
                                                                                                width: "100%",
                                                                                                height: isMobile ? 450 : 969,
                                                                                            }}
                                                                                        ></a>
                                                                                    </div>
                                                                                )
                                                                            }
                                                                        </div>
                                                                    )
                                                                }
                                                                <div className={`collapse ${showContract ? 'show' : ''}`} id="collapseExample" >
                                                                    <div className="form-check">
                                                                        <input
                                                                            className="form-check-input" type="checkbox" value="" id="flexCheckDefault51"
                                                                            onClick={(e) => setAcceptedContract(e.target.checked)}
                                                                        />
                                                                        <label className="form-check-label" htmlFor="flexCheckDefault51">
                                                                            ???????????? ???????????????????????? ????????????, ?????????????? ???????????? ?????????? ??????????????????
                                                                        </label>
                                                                    </div>
                                                                    <div className="d-flex align-items-center justify-content-center mb-4">
                                                                        <button
                                                                            type="button" className="btn btn-sec w-50"
                                                                            onClick={() => handleClose()}>??????????</button
                                                                        >
                                                                        {
                                                                            methodLoading ? (
                                                                                <button
                                                                                    type="button"
                                                                                    className="btn btn-main ms-3 w-50"
                                                                                    disabled
                                                                                >
                                                                                    <span
                                                                                        className="spinner-border spinner-border-sm"
                                                                                        role="status"
                                                                                        aria-hidden="true"
                                                                                    />{' '}
                                                                                    <span className="sr-only">
                                                                                        &nbsp; ?????????? ??????????...
                                                                                    </span>
                                                                                </button>
                                                                            ) : (
                                                                                <button
                                                                                    type="button" className="btn btn-main ms-3 w-50"
                                                                                    disabled={
                                                                                        acceptedContract && (addressChecked || (addressChecked === false && bankAccount !== ""))
                                                                                            ? false : true
                                                                                    }
                                                                                    onClick={() => ContractConfirm()}
                                                                                >
                                                                                    <span>????????????????????????</span>
                                                                                </button>
                                                                            )
                                                                        }
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    className="btn btn-orange"
                                                                    type="button"
                                                                    data-bs-toggle="collapse"
                                                                    data-bs-target="#collapseExample"
                                                                    aria-expanded="false"
                                                                    aria-controls="collapseExample"
                                                                    onClick={() => setShowContract(!showContract)}
                                                                >
                                                                    <span>{showContract ? "????????????????????????" : "????????????????"}</span>
                                                                </button>
                                                            </div>
                                                            <div className="instruction">
                                                                <p className="text-center">
                                                                    <strong>????????????: </strong>
                                                                    ???????????????????????? ???????????????? ???????? ???????????????????? ???????????? ?????????????? 6 ?????????????? ???????????????????????????? ?????? ????????????????????
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )
                                                }
                                                {
                                                    (loanScoringStatus === "INVALID" || loanScoringStatus === "NOT_ENOUGH") && (
                                                        <div className="leasing-status">
                                                            <h5 className="mb-3">?????????????? ????????????????</h5>
                                                            <ul className="leasing-condition list-unstyled d-flex align-items-center justify-content-between flex-column flex-sm-row">
                                                                <li className="default">
                                                                    <span>???????????????? ?????????????? ????????????</span>
                                                                    <strong>{Numeral(statusData?.scoringAmt).format('0,0')}???</strong>
                                                                </li>
                                                                <li className="failed">
                                                                    <span>?????????? ?????? ?????????????? ????????????</span>
                                                                    <strong>{Numeral(statusData?.amount).format('0,0')}???</strong>
                                                                </li>
                                                            </ul>
                                                            <p className="warning-message">
                                                                {
                                                                    loanScoringStatus === "INVALID" || statusData?.scoringAmt === 0 ?
                                                                        (
                                                                            <>
                                                                                ??????????????????, ???? ?????????????? ?????? ???????? ?????????????? ?????????????????? ??????????. <br />
                                                                                {
                                                                                    statusData?.loanSteps[1].statusDesc && statusData?.loanSteps[1].statusDesc.length > 5 && (
                                                                                        <>
                                                                                            <strong style={{ display: "inline-flex" }}>????????????????: </strong>
                                                                                            {" " + (statusData?.loanSteps[1].statusDesc).substring(0, (statusData?.loanSteps[1].statusDesc).length - 5)}
                                                                                        </>
                                                                                    )
                                                                                }
                                                                            </>

                                                                        )
                                                                        :
                                                                        "???? ???????????? ???????????????? ?????? ???? ?????????????? ?????????????????? ???????? ???????????? ?????? ???? ???????????????? ???????? ???????????????????? ???????????????? ?????????? ????."
                                                                }
                                                            </p>
                                                            <hr className="my-4" />
                                                            <div className="d-flex align-items-center justify-content-center">
                                                                <button
                                                                    type="button" className="btn btn-sec w-50"
                                                                    onClick={() => handleClose()}
                                                                >
                                                                    ????????
                                                                </button>
                                                            </div>
                                                            <div className="instruction">
                                                                <p className="text-center">
                                                                    <strong>????????????: </strong>
                                                                    ???????? ?????????? ?????????????????? ???????? ???????????? 77774080 ???????????? ???????????????????? ????.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )
                                                }
                                            </div>
                                        )
                                    }
                                    {
                                        (golomtLevel === 2 || golomtLevel === 3) && inOTP && !success && (
                                            <div>
                                                <div className="leasing-status">
                                                    <div className="confirm-phone-email">
                                                        <h5 className="text-center">???????????????????????????? ?????? ??????????????</h5>
                                                        <div className="form-code mb-3 d-flex flex-column align-items-center">
                                                            <label htmlFor="" className="text-center d-none">???????????????????????????? ??????</label>
                                                            <input
                                                                type="text"
                                                                maxLength="6"
                                                                className="custom-input"
                                                                placeholder="------"
                                                                value={otp}
                                                                onChange={(e) => setOtp(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="counter">
                                                        <strong>{minute.toString().length == 1 ? `0${minute}` : minute}:{second.toString().length == 1 ? `0${second}` : second}</strong>
                                                    </div>
                                                    <p className="suggest-message">
                                                        {`???????? (+976-${phone}) ???????????? ?????? ?????????????????????????????????? ?????????? ???????????????? ??????????.`}
                                                    </p>
                                                </div>
                                                <div className="d-flex flex-column align-items-center">
                                                    {
                                                        methodLoading ? (
                                                            <button
                                                                type="button"
                                                                className="btn btn-main mb-2 w-50"
                                                                disabled
                                                            >
                                                                <span
                                                                    className="spinner-border spinner-border-sm"
                                                                    role="status"
                                                                    aria-hidden="true"
                                                                />{' '}
                                                                <span className="sr-only">
                                                                    &nbsp; ?????????? ??????????...
                                                                </span>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button" className="btn btn-main mb-2 w-50"
                                                                onClick={() => otpVerification()}
                                                            >
                                                                <span>????????????????????????????</span>
                                                            </button>
                                                        )
                                                    }
                                                    {
                                                        secondLoader ? (
                                                            <button
                                                                type="button"
                                                                className="btn btn-main w-50"
                                                                disabled
                                                            >
                                                                <span
                                                                    className="spinner-border spinner-border-sm"
                                                                    role="status"
                                                                    aria-hidden="true"
                                                                />{' '}
                                                                <span className="sr-only">
                                                                    &nbsp; ?????????? ??????????...
                                                                </span>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                className="btn btn-sec w-50"
                                                                onClick={() => otpRequest()}
                                                                disabled={minute == 0 && second == 0 ? false : true}
                                                            >
                                                                ?????????? ?????? ????????
                                                            </button>
                                                        )
                                                    }
                                                </div>
                                                <div className="instruction">
                                                    <p className="text-center">
                                                        <strong>????????????: </strong>
                                                        ?????????????? ?????????????????? ?????????????????????????????? ?????????? ???????? ?????????????????? ?????????? ?????????????????????????????? ???????????? ?????????????? ???????????????????? ???????????????? ????.
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    }
                                    {
                                        success && (
                                            <div className="d-flex justify-content-center">
                                                <Image
                                                    src="/static/images/demo/golomt_loan_success.jpg"
                                                    height={500}
                                                    width={500}
                                                    quality="85"
                                                />
                                            </div>
                                        )
                                    }
                                </div>
                            ) : (
                                <div>
                                    <div className="leasing-status">
                                        <h5 className="mb-3">?????????????? ????????????????</h5>
                                        <ul className="leasing-condition list-unstyled d-flex align-items-center justify-content-between flex-column flex-sm-row">
                                            <li className="default">
                                                <span>???????????????? ?????????????? ????????????</span>
                                                <strong>
                                                    {
                                                        statusData?.scoringAmt === undefined ? (
                                                            0
                                                        ) : (
                                                            Numeral(statusData?.scoringAmt).format('0,0')
                                                        )
                                                    }
                                                    ???
                                                </strong>
                                            </li>
                                            <li className="failed">
                                                <span>?????????? ?????? ?????????????? ????????????</span>
                                                <strong>{Numeral(price).format('0,0')}???</strong>
                                            </li>
                                        </ul>
                                        <p className="warning-message">
                                            ???? ???????????????? ?????????????????? ?????? ???????????? ?????? ???? ???????? ???????????? ???????????????? ?????????????? ???????? ???????? ?????????????? ?????????? ?????????????? ???????????? ?????????????? ????.
                                        </p>
                                        <hr className="my-4" />
                                        <div className="d-flex align-items-center justify-content-center">
                                            <button
                                                type="button" className="btn btn-sec w-50"
                                                onClick={() => handleClose()}
                                            >
                                                ????????
                                            </button>
                                        </div>
                                        <div className="instruction">
                                            <p className="text-center">
                                                <strong>????????????: </strong>
                                                ???????? ?????????? ?????????????????? ???????? ???????????? 77774080 ???????????? ???????????????????? ????.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )
                        }
                    </div>
                </div>
            </div>
            {
                golomtModal && (
                    <div onClick={handleClose} />
                )
            }
        </div >
    )
}

export default GolomtLeasingModal;
