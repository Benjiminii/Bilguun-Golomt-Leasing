import BaseLayout from '@/layouts/BaseLayout'
import BasePage from '@/layouts/BasePage'
import SideBar from '@/components/user/sideBar'
import React, { useCallback, useEffect, useState } from 'react'
import { parseCookies } from 'nookies'
import OrderApi from 'lib/api/orders'
import Moment from 'moment'
import Numeral from 'numeral'
import Image from 'next/image'
import AuthApi from '@/lib/api/auth'
import { useData } from '@/contexts/dataContext'
import PaymentModal from 'components/global/qpayModal'
import withAuth from '@/hocs/withAuth'
import { useRouter } from "next/router";
import axios from "axios";
import Cookies from "js-cookie";
import toast from "@/components/global/toastMessage";
import Link from 'next/link'

import SocialPayModal from "components/global/socialPayModal";
import CashModal from "components/global/cashModal";
import GolomtLeasingModal from "components/global/golomtLeasingModal"
import StorepayModal from "components/product/storepayModal"

import { useGolomtLeasingStatus, useGolomtLeasingPDF } from "actions/golomt";
import { useAuthState } from '@/contexts/auth'

let interval
function Order({ order }) {
  const { user: currentUser } = useAuthState()
  const [paymentModal, setPaymentModal] = useState(false)
  const [paymentSocialPayModal, setPaymentSocialPayModal] = useState(false)
  const [paymentCashModal, setPaymentCashPayModal] = useState(false)
  const [qpay, setQpay] = useState(false)
  const [golomtModal, setGolomtModal] = useState(false)
  const [storepayModal, setStorepayModal] = useState(false)

  const [golomtLevel, setGolomtLevel] = useState(1)
  const [loanScoringStatus, setLoanScoringStatus] = useState("")
  const [golomtLoanSteps, setGolontLoanSteps] = useState([])
  const [success, setSuccess] = useState(false)
  const [bankAccount, setBankAccount] = useState("")
  const [otp, setOtp] = useState("")
  const [selectedMonth, setSelectedMonth] = useState(1)
  const [statusData, setStatusData] = useState()
  const [isGolomtCustomer, setGolomtCustomer] = useState(true)
  const [scopeAndState, setScopeAndState] = useState()
  const [phone, setPhone] = useState("********")
  const [pdfLoader, setPdfLoader] = useState(false)
  const [pdfFile, setPdfFile] = useState(null)
  const { storage } = useData()
  const [getGolomtLeasingStatus] = useGolomtLeasingStatus()
  const [getGolomtLeasingPDF] = useGolomtLeasingPDF()
  const router = useRouter()

  const { type, id, invoice, status_code } = router.query
  const paymentId = order && order.payments[0]?.id
  const accessToken = Cookies.get('banana_token')
  const orderToken = order?.tokenValue
  const paymentType = order.payments[0]?.method?.name
  const city = order.shippingAddress?.city
  const street = order.shippingAddress?.street
  const paid = order?.paymentState
  const placeholderImg = '/product-img-placeholder.svg'

  const notify = useCallback((type, message, time) => {
    toast({ type, message, time })
  }, [])

  useEffect(() => {
    if (storage?.qpay && type && parseInt(type) === 1) {
      setQpay(storage.qpay)
      setPaymentModal(true)
    }
    if (invoice && status_code) {
      setPaymentSocialPayModal(true)
    }
  }, [storage])

  useEffect(() => {
    if (type && parseInt(type) === 3) {
      setPaymentCashPayModal(true)
    }
    if (type && parseInt(type) === 4) {
      setGolomtModal(true)
    }
    if (type && parseInt(type) === 5) {
      setStorepayModal(true)
    }

    if (paymentType === "Golomt leasing") {
      interval = setInterval(() => {
        getGolomtStatus(interval)
      }, 10000)
    }
  }, [])

  useEffect(() => {
    if (statusData) {
      setPdfLoader(true)
      let data = {
        requestId: statusData.requestId
      }
      getGolomtLeasingPDF(data, accessToken)
        .then((res) => {
          let file = new Blob(
            [res],
            { type: 'application/pdf' }
          )
          setPdfFile(URL.createObjectURL(file))
          setPdfLoader(false)
        })
        .catch((err) => {
          console.log(err)
          setPdfLoader(false)
        })
    }
  }, [statusData])

  useEffect(() => {
    if (golomtLoanSteps.length > 0)
      checkGolomtLevel()
  }, [golomtLoanSteps])

  function checkGolomtLevel() {
    for (let i = 1; i < 4; i++) {
      if (golomtLoanSteps[i].statusCd === "SUCCESS") {
        setGolomtLevel(i + 1)
        if (i === 1 && order.total <= statusData.scoringAmt) {
          setLoanScoringStatus("SUCCESS")
          clearInterval(interval)
          notify('success', 'Зээлийн хүсэлт ирлээ')
        }
        if (i === 1 && order.total > statusData.scoringAmt) {
          setLoanScoringStatus("NOT_ENOUGH")
          clearInterval(interval)
          notify('success', 'Зээлийн хүсэлт ирлээ')
        }
      }
      if (golomtLoanSteps[i].statusCd === "INVALID" || golomtLoanSteps[i].statusCd === "FAILED") {
        clearInterval(interval)
        notify('success', 'Зээлийн хүсэлт ирлээ')
        setGolomtLevel(i + 1)
        setLoanScoringStatus("INVALID")
        break
      }
    }
  }

  function getGolomtStatus() {
    if (golomtLevel === 1) {
      getGolomtLeasingStatus(accessToken, orderToken)
        .then((res) => {
          setStatusData(res.data)
          setGolontLoanSteps(res.data.loanSteps)
          setGolomtCustomer(res.data.isCustomer === "Y" ? true : false)
        })
        .catch((e) => {
          if (e.code === 3001) {
            console.log(JSON.parse(e.response))
            clearInterval(interval)
            notify('error', 'Лизингийн мэдээлэл авахад алдаа гарлаа')
          }
        })
    }
  }

  function handleClose() {
    setPaymentModal(!paymentModal)
    router.push(`${process.env.BASE_DOMAIN}user/orders/${id}`)
  }
  function handleSocialPayClose() {
    setPaymentSocialPayModal(!paymentSocialPayModal)
    router.push(`${process.env.BASE_DOMAIN}user/orders/${id}`)
  }
  function handleCashClose() {
    setPaymentCashPayModal(!paymentCashModal)
    router.push(`${process.env.BASE_DOMAIN}user/orders/${id}`)
  }
  function handleGolomtLeasingClose() {
    setGolomtModal(!golomtModal)
  }

  function handlePayment(e, selectPaymentType) {
    e.preventDefault()
    if (renderSwitchPaymentCode(selectPaymentType) === 'qpay') {
      axios
        .post(
          `${process.env.BASE_URL}shop/orders/${id}/qpay-payment`,
          null,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: accessToken ? `Bearer ${accessToken}` : null,
            },
          }
        )
        .then((response) => {
          if (response || response.data) {
            setQpay(response.data.qpay)
            setPaymentModal(true)
          }
        })
        .catch((error) => {
          notify('error', 'Төлбөр төлөхөд алдаа гарлаа')
          setPaymentModal(false)
        })
    }
  }

  function renderSwitchOrderStatus(param) {
    switch (param) {
      case 'cart':
        return (
          <>
          </>
        )
      case 'new':
        return (
          <>
            <li
              className="active"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Шалгагдаж байна"
            >
              <img src="/static/images/icons/user-checking.svg" alt="" />
              <span>Шалгагдаж байна</span>
            </li>
            <li
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Баталгаажсан"
            >
              <img src="/static/images/icons/user-success.svg" alt="" />
              <span>Баталгаажсан</span>
            </li>
            <li
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Хүргэгдсэн"
            >
              <img src="/static/images/icons/user-delivered.svg" alt="" />
              <span>Хүргэгдсэн</span>
            </li>
          </>
        )
      case 'confirmed':
        return (
          <>
            <li
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Шалгагдаж байна"
            >
              <img src="/static/images/icons/user-checking.svg" alt="" />
              <span>Шалгагдаж байна</span>
            </li>
            <li
              className="active"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Баталгаажсан"
            >
              <img src="/static/images/icons/user-success.svg" alt="" />
              <span>Баталгаажсан</span>
            </li>
            <li
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Хүргэгдсэн"
            >
              <img src="/static/images/icons/user-delivered.svg" alt="" />
              <span>Хүргэгдсэн</span>
            </li>
          </>
        )
      case 'fulfilled':
        return (
          <>
            <li
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Шалгагдаж байна"
            >
              <img src="/static/images/icons/user-checking.svg" alt="" />
              <span>Шалгагдаж байна</span>
            </li>
            <li
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Баталгаажсан"
            >
              <img src="/static/images/icons/user-success.svg" alt="" />
              <span>Баталгаажсан</span>
            </li>
            <li
              className="active"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Хүргэгдсэн"
            >
              <img src="/static/images/icons/user-delivered.svg" alt="" />
              <span>Хүргэгдсэн</span>
            </li>
          </>
        )
      case 'cancelled':
      case "abandoned":
        return (
          <>
            <li
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Шалгагдаж байна"
            >
              <img src="/static/images/icons/user-checking.svg" alt="" />
              <span>Шалгагдаж байна</span>
            </li>
            <li
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Баталгаажсан"
            >
              <img src="/static/images/icons/user-success.svg" alt="" />
              <span>Баталгаажсан</span>
            </li>
            <li
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Хүргэгдсэн"
            >
              <img src="/static/images/icons/user-delivered.svg" alt="" />
              <span>Хүргэгдсэн</span>
            </li>
            <li
              className="active"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Цуцлагдсан"
            >
              <img src="/static/images/icons/user-cancelled.svg" alt="" />
              <span>Цуцлагдсан</span>
            </li>
          </>
        )
      default:
        return 'foo'
    }
  }
  function renderSwitchPaymentCode(param) {
    switch (param) {
      case 'QPay':
        return 'qpay'
      case 'Social Pay':
        return 'social_pay'
      case 'lend':
        return 'lend'
      case 'Golomt leasing':
        return 'golomt_leasing'
      case 'Store pay':
        return 'storepay'
      default:
        return 'qpay'
    }
  }
  function renderSwitchPaymentStatus(param) {
    switch (param) {
      case 'awaiting_payment':
        return (
          <>
            <strong className="status preparing" data-bs-trigger="hover" data-bs-placement="top"
              data-bs-toggle="popover"
              data-bs-content="And here's some amazing content. It's very engaging. Right?"
              data-bs-original-title="" title="">Хүлээгдэж байна</strong>
          </>
        )
      case 'partially_authorized':
        return (
          <>
            <strong className="status partly" data-bs-trigger="hover" data-bs-placement="top" data-bs-toggle="popover"
              data-bs-content="And here's some amazing content. It's very engaging. Right?"
              data-bs-original-title="" title="" aria-describedby="popover159068">Хэсэгчлэн хүргэгдсэн</strong>
          </>
        )
      case 'authorized':
        return (
          <>
            <strong className="status success" data-bs-trigger="hover" data-bs-placement="top"
              data-bs-toggle="popover"
              data-bs-content="And here's some amazing content. It's very engaging. Right?"
              data-bs-original-title="" title="" aria-describedby="popover867106">Зөвшөөрөгдсөн</strong>
          </>
        )
      case 'partially_paid':
        return (
          <>
            <strong className="status preparing" data-bs-trigger="hover" data-bs-placement="top"
              data-bs-toggle="popover"
              data-bs-content="And here's some amazing content. It's very engaging. Right?"
              data-bs-original-title="" title="" aria-describedby="popover926339">Хэсэгчлэн төлсөн</strong>
          </>
        )
      case 'paid':
        return (
          <>
            <strong className="status success" data-bs-trigger="hover" data-bs-placement="top"
              data-bs-toggle="popover"
              data-bs-content="And here's some amazing content. It's very engaging. Right?"
              data-bs-original-title="" title="" aria-describedby="popover779040">Төлөгдсөн</strong>
          </>
        )
      case 'cancelled':
        return (
          <>
            <strong className="status cancelled" data-bs-trigger="hover" data-bs-placement="top"
              data-bs-toggle="popover"
              data-bs-content="And here's some amazing content. It's very engaging. Right?"
              data-bs-original-title="" title="" aria-describedby="popover107095">Цуцлагдсан</strong>
          </>
        )
      case 'partially_refunded':
        return (
          <>
            <strong className="status partly cancelled" data-bs-trigger="hover" data-bs-placement="top"
              data-bs-toggle="popover"
              data-bs-content="And here's some amazing content. It's very engaging. Right?"
              data-bs-original-title="" title="" aria-describedby="popover312856">Хэсэгчлэн
              буцаагдсан</strong>
          </>
        )
      case 'refunded':
        return (
          <>
            <strong className="status cancelled" data-bs-trigger="hover" data-bs-placement="top"
              data-bs-toggle="popover"
              data-bs-content="And here's some amazing content. It's very engaging. Right?"
              data-bs-original-title="" title="" aria-describedby="popover145122">Буцаагдсан</strong>
          </>
        )
      case 'failed':
        return (
          <>
            <strong className="status cancelled" data-bs-trigger="hover" data-bs-placement="top"
              data-bs-toggle="popover"
              data-bs-content="And here's some amazing content. It's very engaging. Right?"
              data-bs-original-title="" title="" aria-describedby="popover537965">Амжилтгүй</strong>
          </>
        )
      default:
        return (
          <>
            <strong className="status preparing" data-bs-trigger="hover" data-bs-placement="top"
              data-bs-toggle="popover"
              data-bs-content="And here's some amazing content. It's very engaging. Right?"
              data-bs-original-title="" title="">Хүлээгдэж байна</strong>
          </>
        )
    }
  }

  return (
    <>
      <BaseLayout>
        <BasePage title="Захиалгын дэлгэрэнгүй">
          <section className="user-section pt-4">
            <div className="container">
              <div className="row">
                <SideBar currentTab={'order'} />
                <div className="col-lg-9">
                  {
                    renderSwitchPaymentCode(paymentType) === 'golomt_leasing' && (
                      <div className="golomt-leasing-process">
                        <ul className="list-unstyled d-flex align-items-center justify-content-center steps flex-wrap">
                          <li className="done">
                            <strong>Зээлийн хүсэлт</strong>
                            <p>
                              <span>Илгээгдсэн</span>
                            </p>
                          </li>
                          <li className={`${golomtLevel <= 1 ? "active" : "done"}`}>
                            <strong>Зээлийн тоцоолол</strong>
                            <p>
                              <span>{golomtLevel === 1 ? `Хийгдэж байна` : `Хариу гарсан`}</span>
                            </p>
                          </li>
                          <li className={loanScoringStatus >= 3 ? "success" : (loanScoringStatus === "INVALID" || loanScoringStatus === "NOT_ENOUGH" ? "failed" : "active")}>
                            <strong>Зээлийн гэрээ</strong>
                            <p>
                              <span>{golomtLevel >= 3 ? "Амжилттай" : (loanScoringStatus === "INVALID" || loanScoringStatus === "NOT_ENOUGH" ? "Амжилтгүй" : "Хүлээгдэж байна")}</span>
                            </p>
                          </li>
                          <li className={loanScoringStatus === 4 ? "success" : (loanScoringStatus === "INVALID" || loanScoringStatus === "NOT_ENOUGH" ? "failed" : "active")}>
                            <strong>Зээл олголт</strong>
                            <p>
                              <span>{golomtLevel === 4 ? "Амжилттай" : (loanScoringStatus === "INVALID" || loanScoringStatus === "NOT_ENOUGH" ? "Амжилтгүй" : "Хүлээгдэж байна")}</span>
                            </p>
                          </li >
                        </ul >
                      </div >
                    )
                  }

                  <div className="user-content user-order-content user-order-detail white-bg p-3 p-sm-4 mb-3">
                    <div className="current">
                      <div className="single">
                        <a href="#">
                          <div className="header d-flex align-items-start justify-content-between flex-wrap">
                            <p className="order-id order-sm-1 order-2">
                              <strong>#{order.number}</strong>
                            </p>
                            <ul className="order-steps list-unstyled d-flex align-items-start justify-content-center order-sm-2 order-1">
                              {renderSwitchOrderStatus(order.state)}
                            </ul>
                          </div>
                        </a>
                        <div className="info">
                          <ul className="list-unstyled mb-3 mb-sm-0">
                            <li>
                              <p>
                                <strong>
                                  {Moment(order.checkoutCompletedAt).format(
                                    'YYYY-MM-DD HH:mm'
                                  )}
                                </strong>
                              </p>
                            </li>
                            <li>
                              <p>
                                <span>Төлбөрийн төлөв:</span>
                                {renderSwitchPaymentStatus(order.paymentState)}
                              </p>
                            </li>
                            <li>
                              <p>
                                <span>Дүн:</span>
                                <strong>
                                  {' '}
                                  {Numeral(order.total).format('0,0')}₮
                                </strong>
                              </p>
                            </li>
                            <li>
                              <p>
                                <span>Хүргэлт:</span>
                                <strong>
                                  {' '}
                                  {Numeral(order.shippingTotal).format('0,0')}₮
                                </strong>
                              </p>
                            </li>
                            <li>
                              <p>
                                <span>Төлбөрийн сонголт:</span>
                                <strong> {paymentType}</strong>
                              </p>
                            </li>
                            <li>
                              <p>
                                <span>Хаяг:</span>
                                <strong>
                                  {' '}
                                  {city}, {street}{' '}
                                </strong>
                              </p>
                            </li>
                            <li>
                              <p>
                                <span>Бараа:</span>
                              </p>
                            </li>
                          </ul>
                        </div>
                        {order.items &&
                          order.items.map((product, i) => {
                            const productName = product.variant?.product?.name
                            const variantName = product.variant?.name
                            const productImage =
                              product.variant?.product?.images[0]?.path
                            const productPrice =
                              product.variant?.channelPricings?.FASHION_WEB
                                ?.price
                            const productLink = product.variant?.product?.slug
                            return (
                              <div
                                className="prod d-flex align-items-sm-center align-items-start"
                                key={i}
                              >
                                <Link href={`/product/${productLink}`}>
                                  <a className="product-image">
                                    <Image
                                      src={
                                        productImage
                                          ? process.env.BASE_IMAGE_URL +
                                          productImage
                                          : placeholderImg
                                      }
                                      alt={productName || 'Product Image'}
                                      layout={'fixed'}
                                      loading={productImage ? 'eager' : 'lazy'}
                                      width={96}
                                      height={96}
                                    />
                                  </a>
                                </Link>
                                <div className="product-info d-flex flex-column">
                                  <Link href={`/product/${productLink}`}>
                                    <a className="product-name">
                                      {productName}
                                      {variantName && " - " + variantName}
                                    </a>
                                  </Link>
                                  <div className="d-flex align-items-sm-center align-items-start justify-content-between flex-column flex-sm-row">
                                    <div className="price order-sm-1 order-2">
                                      <strong>
                                        {Numeral(productPrice).format('0,0')}₮
                                      </strong>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        <hr />

                        <div className="d-flex align-items-center gap-2 justify-content-end">
                          {
                            renderSwitchPaymentCode(paymentType) !== 'social_pay' &&
                            renderSwitchPaymentCode(paymentType) !== 'golomt_leasing' &&
                            renderSwitchPaymentCode(paymentType) !== 'storepay' &&
                            <button type={'button'} onClick={e => handlePayment(e, paymentType)}
                              className="btn btn-main flex-sm-grow-0 flex-grow-1 me-auto"
                              disabled={paid === 'paid' ? true : false}
                            >
                              <span>{paid === 'paid' ? 'Төлөгдсөн' : 'Төлбөр төлөх'}</span>
                            </button>
                          }

                          {
                            renderSwitchPaymentCode(paymentType) !== 'golomt_leasing' || (success || golomtLevel >= 3) ? (
                              <div className="d-flex align-items-center gap-2 justify-content-end">
                                <a
                                  href="#"
                                  className="btn btn-main flex-sm-grow-0 flex-grow-1"
                                >
                                  <img
                                    src="/static/images/icons/white-phone.svg"
                                    alt=""
                                  />
                                  <span>Лавлах</span>
                                </a>
                                <Link href={'/user/orders'}>
                                  <a
                                    className="btn btn-sec flex-sm-grow-0 flex-grow-1"
                                  >
                                    <span>Буцах</span>
                                  </a>
                                </Link>
                              </div>
                            ) : (
                              <div className="d-flex align-items-center gap-2 justify-content-end">
                                <a href="#" className="btn btn-sec flex-sm-grow-0 flex-grow-1">
                                  <img
                                    src="/static/images/icons/phone.svg"
                                    alt=""
                                  />
                                  <span>Лавлах</span>
                                </a>
                                <button
                                  type="button" className="btn btn-main flex-sm-grow-0 flex-grow-1"
                                  disabled={golomtLevel !== 1 ? false : true} onClick={() => setGolomtModal(true)}
                                >
                                  <span>{"Хариу харах"}</span>
                                </button>
                              </div>
                            )
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div >
              </div >
            </div >
          </section >
        </BasePage >
      </BaseLayout >
      {
        paymentModal && (
          <PaymentModal
            paymentModal={paymentModal}
            handleClose={handleClose}
            qpay={qpay}
            order={order}
            paymentId={paymentId}
          />
        )
      }
      {
        paymentSocialPayModal && (
          <SocialPayModal
            paymentSocialPayModal={paymentSocialPayModal}
            handleClose={handleSocialPayClose}
            order={order}
            paymentId={paymentId}
          />
        )
      }
      {
        paymentCashModal && (
          <CashModal
            paymentCashModal={paymentCashModal}
            handleClose={handleCashClose}
          />
        )
      }
      {
        golomtModal && (
          <GolomtLeasingModal
            golomtModal={golomtModal}
            handleClose={handleGolomtLeasingClose}
            golomtLevel={golomtLevel}
            orderToken={orderToken}
            accessToken={accessToken}
            price={order.total}
            loanScoringStatus={loanScoringStatus}
            success={success}
            setSuccess={setSuccess}
            otp={otp}
            setOtp={setOtp}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            statusData={statusData}
            bankAccount={bankAccount}
            setBankAccount={setBankAccount}
            golomtLoanUserInfo={currentUser?.golomtLoanUserInfo}
            isGolomtCustomer={isGolomtCustomer}
            scopeAndState={scopeAndState}
            setScopeAndState={setScopeAndState}
            notify={notify}
            interest={currentUser?.golomtLeaseInterest}
            phone={phone}
            setPhone={setPhone}
            orderId={order?.id}
            pdfLoader={pdfLoader}
            setPdfLoader={setPdfLoader}
            pdfFile={pdfFile}
            feePaid={order?.isGolomtFree}
          />
        )
      }
      {
        storepayModal && (
          <StorepayModal
            isOpen={storepayModal}
            setOpen={setStorepayModal}
            isOrderDetail={true}
          />
        )
      }
    </>
  )
}
export async function getServerSideProps(context) {
  let order = []
  // try {
  const { banana_token } = parseCookies(context)
  const user = await new AuthApi(banana_token).getCurrentUser()
  if (user) {
    const id = context.query.id
    const json = await new OrderApi(banana_token).getOrderDetail(id)
    order = json.data
  }
  return { props: { order } }
}
export default withAuth(Order);
// export default Order;
