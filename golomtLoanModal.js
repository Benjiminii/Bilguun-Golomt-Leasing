import React, { useState, useEffect } from "react"
import Numeral from 'numeral'
import { useRouter } from 'next/router'
import { isBrowser, isMobile } from 'react-device-detect'
import { useAuthState } from '@/contexts/auth'
// import Slider, { SliderTooltip } from "rc-slider";

// const { Handle } = Slider;

// const handle = (props) => {
//     const { value, dragging, index, ...restProps } = props;
//     return (
//         <SliderTooltip
//             overlay={value}
//             visible={dragging}
//             placement="bottom"
//             key={index}
//         >
//             <Handle value={value} {...restProps} />
//         </SliderTooltip>
//     );
// };
const MonthRanges = [
    {
        maxRange: 500000,
        maxMonth: 6
    }, {
        maxRange: 1000000,
        maxMonth: 12
    }, {
        maxRange: 3000000,
        maxMonth: 18
    }, {
        maxRange: 5000000,
        maxMonth: 24
    }, {
        maxRange: 10000000,
        maxMonth: 30
    },
]

const GolomtLoanModal = ({ isOpen, setOpen, products, selectedOptions, handleAddToCart, price, count, isCheckout, orderToken, paymentId }) => {
    const { user: currentUser } = useAuthState()
    const [selectedMonth, setSelectedMonth] = useState(3)
    const [maxMonth, setMaxMonth] = useState(30)

    const interest = currentUser?.golomtLeaseInterest
    const router = useRouter()

    const loanClick = () => {
        setOpen(false)
        router.push({
            pathname: '/cart/golomtleasingform',
            query: {
                price: price,
                interest: interest,
                months: selectedMonth,
                orderToken: orderToken,
                paymentId: paymentId,
                monthlyPayment: price * (interest / 100 + 1) / selectedMonth,
            }
        })
    }
    useEffect(() => {
        for (let i = 0; i < MonthRanges.length; i++) {
            if (MonthRanges[i].maxRange > price) {
                setMaxMonth(MonthRanges[i].maxMonth)
                break
            }
        }
    }, [])

    const cartClick = () => {
        setOpen(false)
        handleAddToCart({ quantity: count })
    }

    return (
        <div
            className={`modal fade leasing-modal ${isOpen ? "show" : ""}`}
            onClick={() => setOpen(false)}
            id="leasingModal" tabIndex="-1"
            style={{
                display: isOpen ? "block" : "",
                padding: "0.5rem",
                background: isOpen ? "rgb(0, 0, 0, 0.5)" : "",
            }}
        >
            <div className="modal-dialog modal-lg">
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <div className="modal-body">
                        {
                            isCheckout === true ? (
                                <div>
                                    <h1 className="d-flex align-items-center">
                                        <img src="/static/images/payment-logos/golomt-loan.png" alt="" className="image" />
                                        <strong style={{ color: "rgb(113,106,251)" }}>???????????? ?????????????? ?????????????????? ???????????????? ?????????????? ????????</strong>
                                        <button type="button" className="btn-close ms-auto" data-bs-dismiss="modal" aria-label="Close" onClick={() => setOpen(false)}>
                                            <img src="/static/images/icons/times.svg" alt="" className="svg-icon" />
                                        </button>
                                    </h1>
                                    {
                                        isBrowser && (
                                            <ul className="list-unstyled d-flex align-items-start justify-content-center leasing-steps">
                                                <li className="active">
                                                    <span>1</span>
                                                    <strong>?????????????? ????????????</strong>
                                                </li>
                                                <li>
                                                    <span>2</span>
                                                    <strong>?????????????? ??????????</strong>
                                                </li>
                                                <li>
                                                    <span>3</span>
                                                    <strong>???????????? ????????????</strong>
                                                </li>
                                                <li>
                                                    <span>4</span>
                                                    <strong>???????? ????????????????????????????</strong>
                                                </li>
                                            </ul>
                                        )
                                    }
                                </div>
                            ) : (
                                <div>
                                    <h1 className="d-flex align-items-center">
                                        <img src="/static/images/payment-logos/golomt-loan.png" alt="" className="image" />
                                        <strong style={{ color: "rgb(113,106,251)" }}>30 ?????????? ???????????????????? 10 ?????? ???????????? ???????????? ????????</strong>
                                        <button type="button" className="btn-close ms-auto" data-bs-dismiss="modal" aria-label="Close" onClick={() => setOpen(false)}>
                                            <img src="/static/images/icons/times.svg" alt="" className="svg-icon" />
                                        </button>
                                    </h1>
                                    <p>
                                        ???????????? ???????????? ???????????????? ?????????????? ???????? ???? ?????? ???????????? ?????????????????? ???????? ?????????? ??????????????????. ???????????? ???????????? ???????????????????????? ?????????? ?????????????? ?????? ?????????????? ?????????????????? ?????????????? ??????????. ?????????? ???????????? ?????????????? ???????????????????? ?????????????????????? ?????????????? ???????????? ?????????????????????????????? ?????????? ???????????? ???????????? ???????? ?????? ?????????????? ???????? ???????????????????????? ???????????? ?????????????? ?????????????????????? ???????????????? ????.
                                    </p>
                                </div>
                            )
                        }
                        {
                            products.map((product, index) => {
                                let name
                                let variantName
                                if (selectedOptions === undefined) {
                                    name = product?.variant?.product?.name
                                    variantName = product?.variant?.name
                                }
                                else {
                                    name = product?.name
                                    variantName = selectedOptions
                                }
                                return (
                                    <div className="product" key={index}>
                                        <div className="d-flex align-items-start align-items-sm-center flex-column flex-sm-row">
                                            <img
                                                src={
                                                    product.images ?
                                                        product.images[0].productPngThumbnail
                                                        :
                                                        product.variant.product.images[0].productPngThumbnail
                                                }
                                                alt=""
                                            />

                                            <ul className="list-unstyled detail">
                                                <li className="name">
                                                    <strong>
                                                        {
                                                            selectedOptions === null || selectedOptions === undefined ?
                                                                name
                                                                :
                                                                `${name} - ${variantName}`
                                                        }
                                                    </strong>
                                                </li>
                                                <li>
                                                    <span>???????????? ??????: </span>
                                                    <strong>{Numeral(product?.discountedUnitPrice ? product.discountedUnitPrice : price).format('0,0') + '???'}</strong>
                                                </li>
                                                <li>
                                                    <span>??????: </span>
                                                    <strong>{count ? count : product.quantity} ????????????</strong>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                )
                            })
                        }

                        <div className="banana-range">
                            <ul className="list-unstyled monthly d-flex align-items-center justify-content-between flex-wrap">
                                <li>
                                    <span>???????? ??????????:</span>
                                    <strong>{Numeral(price * (interest / 100 + 1) / selectedMonth).format('0,0') + '???'}</strong>
                                </li>
                                <li>
                                    <span>??????:</span>
                                    <strong>{interest}%</strong>
                                </li>
                                <li>
                                    <span>??????????????:</span>
                                    <strong>{Numeral(Math.round(price * 0.01)).format('0,0') + '???'}</strong>
                                </li >
                                <li>
                                    <span>??????????????:</span>
                                    <strong>{selectedMonth} ??????</strong>
                                </li>
                            </ul >
                            <label htmlFor="customRange1" className="form-label d-none">
                                <span>??????????????:</span>
                                <strong>{selectedMonth} ??????</strong>
                            </label>

                            <input
                                type="range"
                                className="form-range"
                                id="customRange1"
                                onChange={e => setSelectedMonth(Math.round(e.target.value / 100 * (maxMonth - 3) + 3))}
                                value={Math.round((selectedMonth - 3) / (maxMonth - 3) * 100)}
                            />
                            {/* <div style={{ width: 400, margin: 50 }}>
                                <Slider
                                    min={3}
                                    max={30}
                                    defaultValue={selectedMonth}
                                    handle={handle}
                                />
                            </div> */}

                            <p className="two-ranges d-flex align-items-center justify-content-between">
                                <strong>3 ??????</strong>
                                <strong>{maxMonth} ??????</strong>
                            </p>
                        </div >

                        {
                            isCheckout === true ? (
                                <div style={{ display: "flex" }}>
                                    <button type="button" className="btn btn-sec mx-3 w-50" onClick={() => setOpen(false)}>
                                        <span>??????????</span>
                                    </button>
                                    <button type="button" className="btn btn-main mx-3 w-50" onClick={loanClick}>
                                        <span>????????????????????????</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="d-flex align-items-center justify-content-center">
                                    <button
                                        type="button"
                                        className="btn btn-main mx-3 w-50"
                                        onClick={() => cartClick()}
                                    >
                                        <span>??????????????</span>
                                    </button>
                                </div>
                            )
                        }


                        <div className="instruction" style={{ textAlign: "center", borderBottom: "0.75rem" }}>
                            {
                                isCheckout === true ? (
                                    <strong style={{ textAlign: "center" }}>
                                        ???????? ?????????????? ???????????? ?????????????????????????? ???????? 1-10 ?????????????? ?????????????????? ?????????? ??????????.
                                    </strong>
                                ) : (
                                    <ul className="list-unstyled">
                                        <li>
                                            <span>1</span>
                                            <strong>???????????? ???????????? ?????????????????????? ?????????????? <i>(300???000??? - 10???000???000??? -?? ??????????????)</i></strong>
                                        </li>
                                        <li>
                                            <span>2</span>
                                            <strong>???????????????????? ???????? ?????????????? <i>(?????????????????? ???????????? ??????????, ?????????????? ???????????????????? ???????? ???????????? ????????)</i></strong>
                                        </li>
                                        <li>
                                            <span>3</span>
                                            <strong>?????????????????? ?????????????? ?????????????? ??????????????? ???????????? ???????????-?????? ???????????? ???????????? ????????????????????????.</strong>
                                        </li>
                                    </ul>
                                )
                            }
                        </div>
                    </div >
                </div >
            </div >
        </div >

    )
}

export default GolomtLoanModal