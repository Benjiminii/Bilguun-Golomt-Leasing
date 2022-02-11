import BaseLayout from '@/layouts/BaseLayout'
import BasePage from '@/layouts/BasePage'
import Breadcrumb from '@/components/global/breadcrumb'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import ProductsApi from '@/lib/api/product'
import { useRouter } from 'next/router'
import isEmpty from '@/utils/isEmpty'
import Numeral from 'numeral'
import VariantSelector from 'components/product/variantSelector'
import { Formik, Field } from 'formik'
import * as Yup from 'yup'
import {
  useCreateCart,
  useAddItemsCart,
  useMultiItemsCart,
} from '@/actions/carts'
import Cookies from 'js-cookie'
import { useCartDispatch, useCartState } from '@/contexts/cart'
import { useAddWishList, useDeleteWishList } from '@/actions/wishlist'
import { useAuthState } from '@/contexts/auth'
import moment from 'moment'
import CountDown from '@/components/global/countDown'
import Link from 'next/link'
import Image from 'next/image'
import toast from '@/components/global/toastMessage'
import Loader from '@/components/loading/loader'
import { NextSeo } from 'next-seo'
import ProductDetailLoading from '@/components/loading/productDetailLoading'
import { useViewProduct } from '@/actions/product'
import DefaultErrorPage from 'next/error'
import {
  FacebookShareButton,
  TwitterIcon,
  TwitterShareButton,
  FacebookIcon,
} from "react-share";
import { IoHeart } from "react-icons/io5";
import RelatedProducts from "components/product/relatedProducts";
import { Head } from "next/document";
import ViewUsers from "@/components/global/viewUsers";
import ProductZoomSlider from "components/product/productZoomSlider";
import striptags from "striptags";
import BreadcrumbProduct from "@/components/global/breadcrumbProduct";

import GolomtLoanModal from 'components/product/golomtLoanModal'
import StorepayModal from 'components/product/storepayModal'
import { isBrowser } from 'react-device-detect'
import SecretModal from 'components/global/secretModal'

const Product = ({ product, errors }) => {
  const [selectedOptions, setSelectedOptions] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
  const [totalPrice, setTotalPrice] = useState(null)
  const [more, setMore] = useState(false)
  const [golomtModal, setGolomtModal] = useState(false)
  const [storepayModal, setStorepayModal] = useState(false)
  const [secretModal, setSecretModal] = useState(false)
  const [
    createCart,
    {
      data: createCartData,
      loading: createCartLoading,
      error: createCartError,
    },
  ] = useCreateCart()
  const [
    deleteWishList,
    {
      loading: deleteWishListLoading,
    },
  ] = useDeleteWishList()
  const [viewProduct] = useViewProduct()
  const [
    addItemCart,
    { data: addCartData, loading: addCartLoading, error: addCartError },
  ] = useAddItemsCart()

  const [
    multiItemCart,
    { data: multiCartData, loading: multiCartLoading, error: multiCartError },
  ] = useMultiItemsCart()

  const formRef = useRef(1);

  const [
    addWishList,
    { data: addWishData, loading: addWishLoading, error: addWishError },
  ] = useAddWishList()
  const accessToken = Cookies.get('banana_token')
  const { setCart, setWish } = useCartDispatch()
  const { wishList } = useCartState()
  const wishListLike = wishList?.filter((item) => item.code === product?.code)
  const { isAuthenticated, user: currentUser, } = useAuthState()
  const orderToken = Cookies.get('banana_order_token')
  const uuid = Cookies.get('uuid')
  const router = useRouter()
  const shareUrl = 'https://bananamall.mn/product/' + router.query.slug;

  const notify = useCallback((type, message) => {
    toast({ type, message })
  }, [])

  const handleMoreToggle = () => {
    setMore(!more)
  }

  const valentinePhotoSwitch = () => {
    switch (product?.slug) {
      case "intense-kheluu-odoogch-serum":
        return 4
      case "apple-airpods-3rd-gen-a2565-a2564-a2566-mme73za-a":
        return 2
      case "redmagic-6r-silver":
        return 3
      case "65-q800t-8k-smart-qled-tv-2020":
        return 1
      case "apple-macbook-air-13-3-m1-chip-16gb-space-gray-14068":
        return 2
      case "isispharma-aquaruboril-400-ml-emzeg-ulailttai-arsny-mitselliar-us":
        return 3
      case "love-edt-united-colors-of-benetton-15923":
        return 1
      case "zero-day-cream-15784":
        return 2
      case "propolis-b5-glow-barrier-calming-toner-150ml":
        return 3
      case "emchilgeenii-tos-180gr":
        return 2
      case "ger-spa-bie-archilgaany-bagts-1575":
        return 1
      default:
        return null
    }
  }

  useEffect(() => {
    if (uuid && product) {
      let itemData = {}
      itemData = {
        productCode: product?.code,
        uuid: uuid,
      }
      viewProduct(itemData)
    }
  }, [product, uuid])

  useEffect(() => {
    if (!product?.variants[0]) {
      return
    }
    setSelectedOptions(product?.variants[0])
  }, [product])

  function onSelectOption(id) {
    const parseIntValue = parseInt(id, 10)
    const variantDetail = product?.variants.find(
      (candidate) => candidate.id === parseIntValue
    )
    if (!variantDetail) {
      return
    }
    setSelectedOptions(variantDetail)
  }

  const handleAddToCart = async (values) => {
    if (!selectedOptions || !product) {
      console.log('hooson')
      return
    }
    let itemData = {}
    itemData = {
      productCode: product.code,
      productVariantCode: selectedOptions?.code,
      quantity: Number(values?.quantity),
    }
    if (orderToken && orderToken !== 'undefined') {
      await addItemCart(itemData, orderToken, accessToken)
        .then(async (res) => {
          if (res.code === 500) {
            notify('info', 'Энэ барааны үлдэгдэл хүрэлцэхгүй байна')
            return
          }
          setCart(res, orderToken)
          notify('success', 'Амжилттай сагсанд нэмэгдлээ')
        })
        .catch(async (err) => {
          const createCartResult = await createCart({})
          if (!createCartResult) {
            return
          }
          Cookies.set('banana_order_token', createCartResult?.tokenValue)
          await addItemCart(itemData, createCartResult?.tokenValue, accessToken)
            .then(async (res) => {
              setCart(res, createCartResult?.tokenValue)
              notify('success', 'Амжилттай сагсанд нэмэгдлээ')
            })
            .catch(async (err) => {
              Cookies.remove('banana_order_token')
              notify('info', 'Сагслахад асуудал гарлаа.. Та дахин сагслаад үзнэ үү')
            })
          // Cookies.remove('banana_order_token')
          // notify('info', 'Сагслахад асуудал гарлаа.. Та дахин сагслаад үзнэ үү')
        })
      return
    }

    const createCartResult = await createCart({})
    if (!createCartResult) {
      return
    }
    Cookies.set('banana_order_token', createCartResult?.tokenValue)
    await addItemCart(itemData, createCartResult?.tokenValue, accessToken)
      .then(async (res) => {
        setCart(res, createCartResult?.tokenValue)
        notify('success', 'Амжилттай сагсанд нэмэгдлээ')
      })
      .catch(async (err) => {
        notify('error', 'Сагслахад алдаа гарлаа')
      })
  }

  const handleMultiAddCart = async (values) => {
    const checkedProducts = values.checkboxOptions?.map((cnt, i) => {
      return selectedProducts?.filter((item) => item?.code === cnt)
    })
    if (isEmpty(checkedProducts)) {
      notify('info', 'Та бараагаа сонгоно уу')
      return
    }
    const data = []
    checkedProducts?.map((product) => {
      const item = {
        productCode: product[0]?.code,
        productVariantCode: product[0]?.variants[0].code,
        quantity: 1,
      }
      data.push(item)
    })
    let itemData = {}
    itemData = {
      items: data,
    }
    await multiItemCart(itemData, orderToken, accessToken)
      .then(async (res) => {
        setCart(res, orderToken)
        notify('success', 'Амжилттай сагсанд нэмэгдлээ')
      })
      .catch(() => notify('error', 'Сагслахад алдаа гарлаа'))
  }

  const handleAddToWish = async (code) => {
    if (!isAuthenticated) {
      router.push({
        pathname: '/auth/login',
        query: {
          from: router.asPath
        }
      })
    }

    if (!code) {
      return
    }

    let itemData = {}
    itemData = {
      productCode: code,
    }

    if (accessToken && accessToken !== 'undefined') {
      await addWishList(itemData, accessToken)
        .then((res) => {
          setWish(res)
          notify('success', 'Таалагдсан бараа амжилттай нэмэгдлээ')
        })
        .catch(() => notify('error', 'Жагсаалтанд нэмэхэд алдаа гарлаа'))
      return
    }
  }

  const handleRemoveToWish = (code) => {

    if (!isAuthenticated) {
      router.push('/auth/login')
    }

    if (!code) {
      return
    }

    let itemData = {}
    itemData = {
      productCode: code,
    }
    if (accessToken && accessToken !== 'undefined') {
      deleteWishList(itemData, accessToken)
        .then((res) => {
          setWish(res)
          notify('success', 'Таалагдсан бараа амжилттай хасагдлаа')
        })
        .catch(() => notify('error', 'Жагсаалтанд нэмэхэд алдаа гарлаа'))
    }
  }


  const MyCheckbox = ({ field, form, id, ...rest }) => {
    const { name, value: formikValue } = field
    const { setFieldValue } = form

    const handleChange = (event) => {
      const values = formikValue || []
      const index = values.indexOf(rest.value)
      if (index === -1) {
        values.push(rest.value)
        const select = associations.filter((item) => item?.code === rest.value)
        setSelectedProducts((selectProducts) => [...selectProducts, select[0]])
      } else {
        values.splice(index, 1)
        setSelectedProducts(
          selectedProducts.filter((item) => item?.code !== rest.value)
        )
      }
      setFieldValue(name, values)
    }

    return (
      <input
        className="form-check-input"
        type="checkbox"
        onChange={handleChange}
        id={id}
        checked={formikValue.indexOf(rest.value) !== -1}
        {...rest}
      />
    )
  }

  const ProductImages = isEmpty(product) === false ? product?.images : ''
  const variants = product && product?.variants
  const ProductDescription = product && product.description
  const shortDescription = product && product.shortDescription
  const price = selectedOptions?.channelPricings?.FASHION_WEB.originalPrice
  const stock = selectedOptions?.inStock
  const salePrice = parseInt(
    selectedOptions?.channelPricings?.FASHION_WEB.price
  )
  const promoPrice =
    salePrice < price ? (
      <>
        <li className="price">{Numeral(salePrice).format('0,0') + '₮'}</li>
        <li className="sale">{Numeral(price).format('0,0') + '₮'}</li>
      </>
    ) : (
      <li className="price">{Numeral(price).format('0,0') + '₮'}</li>
    )
  const endTime = selectedOptions?.channelPricings?.FASHION_WEB?.promotionEndsAt
  const date = moment(endTime).format('ll')
  const time = moment(endTime).format('HH:mm:ss')
  const brandImageLogo =
    product?.brand &&
    process.env.BASE_IMAGE_URL + encodeURIComponent(product?.brand?.images[0]?.path)
  const brandName = product?.brand && product?.brand?.name
  const percentage = Math.round(
    (100 * ((price || 0) - (salePrice || 0))) / price || 0
  )

  const placeholderImg = '/product-img-placeholder.svg'

  useEffect(() => {
    const associations =
      product?.associations?.length > 0
        ? product?.associations.filter(
          (item) => item?.type?.code === 'together_products'
        )[0]?.associatedProducts
        : null
    setSelectedProducts(associations)
  }, [])

  useEffect(() => {
    const totalVariants =
      selectedProducts &&
      selectedProducts?.map((cnt) => {
        return cnt?.variants?.reduce((c) => {
          return c
        })
      })
    const clearTotalPrice = totalVariants?.filter(function (element) {
      return element !== undefined
    })
    setTotalPrice(
      clearTotalPrice?.reduce(function (acc, val) {
        return acc + val?.channelPricings?.FASHION_WEB?.price
      }, 0)
    )
  }, [selectedProducts])
  const associations =
    product?.associations?.length > 0
      ? product?.associations.filter(
        (item) => item?.type?.code === 'together_products'
      )[0]?.associatedProducts
      : null
  const variantCodes = associations?.map((cnt) => {
    return cnt?.code
  })
  if (router.isFallback) {
    return (
      <>
        <BaseLayout>
          <BasePage title="Product">
            <ProductDetailLoading />
            <Loader />
          </BasePage>
        </BaseLayout>
      </>
    )
  }

  if (errors) {
    return <>
      <Head>
        <meta name="robots" content="noindex" />
      </Head>
      <DefaultErrorPage statusCode={404} />
    </>
  }
  return (
    <BaseLayout>
      <BasePage>
        <NextSeo
          title={product?.name}
          description={striptags(product.description)}
          openGraph={{
            type: 'website',
            title: product.name,
            description: striptags(product.description),
            images: [
              {
                url: process.env.BASE_IMAGE_URL + `${product.images[0]?.path}`,
                width: 800,
                height: 600,
                alt: product.name,
              },
            ],
          }}
        />
        <BreadcrumbProduct categoryName={product?.name} />
        <section className="product-detail white-bg">
          <div className="container">
            <div className="row">
              <div className="col-lg-6">
                <ProductZoomSlider images={ProductImages} />
              </div>
              <div className="col-lg-6">
                <div className="product-detail-container">
                  {brandImageLogo && (
                    <Link href={`/brands/${product?.brand?.id}`}>
                      <a className="brand d-flex align-items-center">
                        <img
                          src={brandImageLogo ? brandImageLogo : placeholderImg}
                          alt="Brand logo"
                        />
                        <p>{brandName}</p>
                      </a>
                    </Link>
                  )}
                  <h1>
                    {
                      selectedOptions?.name !== null ?
                        `${product?.name} - ${selectedOptions?.name}`
                        : product?.name
                    }
                  </h1>
                  <ul className={`price-container ${salePrice < price ? 'on-sale' : ''} d-flex align-items-center flex-wrap list-unstyled`}>
                    {salePrice < price
                      ? percentage !== 0 && (
                        <li className="percent">{percentage}%</li>
                      )
                      : null}
                    {promoPrice}
                  </ul>
                  {endTime && <CountDown targetDate={date} targetTime={time} />}
                  {
                    variants.length > 1 &&
                    <div className="single">
                      <h5>Сонголт</h5>
                      <VariantSelector
                        variants={variants}
                        selectedOptions={selectedOptions}
                        onSelectOption={onSelectOption}
                      />
                    </div>
                  }

                  <Formik
                    initialValues={{
                      quantity: 1,
                    }}
                    validationSchema={Yup.object().shape({
                      quantity: Yup.number()
                        .min(1, 'Тоо хэмжээ хамгийн багадаа 1 байна')
                        .required('Тоо хэмжээ оруулна уу'),
                    })}
                    onSubmit={handleAddToCart}
                    innerRef={formRef}
                  >
                    {({
                      values,
                      handleChange,
                      handleBlur,
                      handleSubmit,
                      errors,
                      setFieldValue,
                    }) => (
                      <form onSubmit={handleSubmit}>
                        <div className="single count">
                          <h5>Тоо ширхэг</h5>
                          <div className="input-group">
                            <button
                              className="btn"
                              type="button"
                              onClick={() =>
                                setFieldValue(
                                  'quantity',
                                  values.quantity > 1 ? values.quantity - 1 : 1
                                )
                              }
                            >
                              <img
                                src="/static/images/icons/minus.svg"
                                alt=""
                              />
                            </button>
                            <input
                              name="quantity"
                              type="text"
                              className="form-control"
                              placeholder=""
                              value={values.quantity}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              aria-label="Example text with button addon"
                              aria-describedby="button-addon1"
                            />
                            <button
                              className="btn"
                              type="button"
                              onClick={() =>
                                setFieldValue('quantity', values.quantity + 1)
                              }
                            >
                              <img src="/static/images/icons/plus.svg" alt="" />
                            </button>
                            {errors.quantity && (
                              <>
                                <br />
                                <p className="text-danger">{errors.quantity}</p>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="action">
                          {addCartLoading ||
                            createCartLoading ||
                            multiCartLoading ? (
                            // cartLoading
                            <button
                              type="submit"
                              className="btn btn-main"
                              disabled
                            >
                              <span
                                className="spinner-border spinner-border-sm"
                                role="status"
                                aria-hidden="true"
                              />{' '}
                              <span className="sr-only">
                                &nbsp; Уншиж байна...
                              </span>
                            </button>
                          ) : (
                            <button
                              type="submit"
                              className="btn btn-main"
                              disabled={stock ? false : true}
                            >
                              {stock ? 'Сагслах' : 'Бараа дууссан'}
                            </button>
                          )}
                          {addWishLoading || deleteWishListLoading ? (
                            <button
                              type="button"
                              className="btn btn-sec"
                              disabled
                            >
                              <span
                                className="spinner-border spinner-border-sm"
                                role="status"
                                aria-hidden="true"
                              />
                              <span className="sr-only">&nbsp; Уншиж байна...</span>
                            </button>
                          ) : wishListLike && wishListLike?.length !== 0 ? (
                            <button
                              type="button"
                              className="btn btn-sec active"
                              onClick={() => handleRemoveToWish(product.code)}
                            >
                              <img
                                src="/static/images/icons/heart-small.svg"
                                alt=""
                                className="default"
                              />
                              <img
                                src="/static/images/icons/pink-heart.svg"
                                alt=""
                                className="active"
                              />
                              <span>Хадгалагдсан</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-sec"
                              onClick={() => handleAddToWish(product.code)}
                            >
                              <img
                                src="/static/images/icons/heart.svg"
                                alt=""
                              />
                              <span>Хадгалах</span>
                            </button>
                          )}
                        </div>
                      </form>
                    )}
                  </Formik>

                  <div className="leasing-action">
                    <div className="row">
                      {
                        currentUser?.golomtLeaseInterest !== 0 && currentUser?.golomtLeaseInterest !== undefined && (
                          <div className="col-sm">
                            <button className="btn" type="button" data-bs-toggle="modal" data-bs-target="#leasingModal" onClick={() => setGolomtModal(true)}>
                              <div className="single d-flex align-items-center w-100">
                                <img src="/static/images/payment-logos/golomt-loan.png" alt="" className="image" />
                                <strong>Голомт банк</strong>
                                <img src="/static/images/icons/chevron-blue.svg" alt="" className="svg-icon" />
                              </div>
                              <p>Зээлээр 30 сар хуваан төлөх боломж</p>
                            </button>
                          </div>
                        )
                      }
                      <div className="col-sm">
                        <button className="btn" type="button" onClick={() => setStorepayModal(true)}>
                          <div className="single d-flex align-items-center w-100 store-pay">
                            <img src="/static/images/payment-logos/store-pay.png" alt="" className="image" />
                            <strong>Store Pay</strong>
                            <img src="/static/images/icons/chevron-blue.svg" alt="" className="svg-icon" />
                          </div>
                          <p>Ямар ч хүү шимтгэлгүйгээр 4 хуваан төлөх боломж</p>
                        </button>
                      </div>
                    </div>
                  </div>

                  {salePrice > 30000 ?
                    <div className="product-options">
                      <div className="single d-flex align-items-center">
                        <img src="/static/images/icons/shield.svg" alt="" />
                        <ul className="list-unstyled">
                          <li>
                            <p>Хүргэгдэх боломжтой</p>
                          </li>
                          <li>
                            <span>24 цагийн дотор хүргэгдэнэ.</span>
                          </li>
                        </ul>
                      </div>
                      <div className="single d-flex align-items-center">
                        <img src="/static/images/icons/delivery.svg" alt="" />
                        <ul className="list-unstyled">
                          <li>
                            <p>Хүргэлт</p>
                          </li>
                          <li>
                            <span>Хүргэлт үнэгүй</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                    :
                    <div className="product-options">
                      <div className="single d-flex align-items-center">
                        <img src="/static/images/icons/shield.svg" alt="" />
                        <ul className="list-unstyled">
                          <li>
                            <p>Хүргэгдэх боломжтой</p>
                          </li>
                          <li>
                            <span>24 цагийн дотор хүргэгдэнэ.</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  }
                  <ul className="list-unstyled share-this d-flex align-items-center flex-wrap">
                    <li>Хуваалцах:</li>
                    <li>
                      <FacebookShareButton
                        url={shareUrl}
                        quote={product?.name}
                      >
                        <FacebookIcon size={32} round />
                      </FacebookShareButton>
                    </li>
                    <li>
                      <TwitterShareButton
                        url={shareUrl}
                        title={product?.name}
                      >
                        <TwitterIcon size={32} round />
                      </TwitterShareButton>
                    </li>
                    {
                      valentinePhotoSwitch() !== null && (
                        <div>
                          <img
                            width={35}
                            height={35}
                            src="/static/images/icons/heart-full.svg"
                            alt="heart"
                            style={{ cursor: "pointer" }} onClick={() => setSecretModal(true)}
                          />
                        </div>
                      )
                    }
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="product-features white-bg">
          <div className="container">
            <div className={`features-container ${more && 'active'}`}>
              <div className="row">
                <div className="col-lg-10">
                  <div className="single">
                    <h5>Барааны тухай</h5>
                    <ul className="list-unstyled">
                      <div
                        className="text"
                        dangerouslySetInnerHTML={{
                          __html: striptags(ProductDescription, '<strong><p><br><li>'),
                        }}
                      />
                    </ul>
                  </div>
                </div>
              </div>
              <div className="d-flex d-sm-none justify-content-center feature-view">
                <button className="btn more" onClick={handleMoreToggle}>
                  Дэлгэрэнгүй
                </button>
                <button className="btn less" onClick={handleMoreToggle}>
                  Хураангуй
                </button>
              </div>
            </div>
          </div>

          {
            shortDescription && typeof document !== 'undefined' && (
              shortDescription.split(', ').map((curr, index) => {
                return (
                  <div
                    className="container my-4"
                    key={index}
                    style={{
                      position: "relative",
                      overflow: "hidden",
                      width: "100%",
                      paddingTop: isBrowser ? "30%" : "56.25%",
                    }}
                  >
                    <iframe
                      src={curr}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        width: "100%",
                        height: "100%"
                      }}
                    >
                    </iframe>
                  </div>
                )
              })
            )
          }

        </section>
        {product?.associations?.length > 0 && selectedProducts ? (
          <>
            <section className="bought-together white-bg">
              <div className="container">
                <h2>Хамтад нь авбал зохимжтой</h2>
                <Formik
                  initialValues={{
                    checkboxOptions: variantCodes,
                  }}
                  validationSchema={Yup.object().shape({
                    checkboxOptions: Yup.array().required(
                      'Багадаа нэг бараа сонгосон байх ёстой'
                    ),
                  })}
                  onSubmit={handleMultiAddCart}
                >
                  {({
                    values,
                    handleChange,
                    handleBlur,
                    handleSubmit,
                    errors,
                    setFieldValue,
                  }) => (
                    <form onSubmit={handleSubmit}>
                      <ul className="list-unstyled d-flex align-items-center flex-wrap">
                        {selectedProducts &&
                          selectedProducts.map((p, i) => {
                            const productImage =
                              p?.images?.length > 0
                                ? process.env.BASE_IMAGE_URL +
                                p?.images[0]?.path
                                : placeholderImg
                            return (
                              <React.Fragment key={i}>
                                <li>
                                  <Link href={`/product/${p?.slug}`}>
                                    <a>
                                      <Image
                                        src={productImage}
                                        alt={p?.name || 'Product Image'}
                                        layout={'fixed'}
                                        width={64}
                                        height={64}
                                        loading={
                                          productImage ? 'eager' : 'lazy'
                                        }
                                      />
                                    </a>
                                  </Link>
                                </li>
                                <li>
                                  <img
                                    src="/static/images/icons/plus.svg"
                                    alt=""
                                  />
                                </li>
                              </React.Fragment>
                            )
                          })}
                        <li className="equals">
                          <img src="/static/images/icons/equals.svg" alt="" />
                        </li>
                        <li>
                          <p className="text">Нийт үнэ:</p>
                          <p className="price">
                            {Numeral(totalPrice).format('0,0')} ₮{' '}
                          </p>
                        </li>
                        <li>
                          {multiCartLoading ? (
                            <button
                              type="submit"
                              className="btn btn-main"
                              disabled
                            >
                              <span
                                className="spinner-border spinner-border-sm"
                                role="status"
                                aria-hidden="true"
                              />{' '}
                              <span className="sr-only">
                                &nbsp; Уншиж байна...
                              </span>
                            </button>
                          ) : (
                            <button type="submit" className="btn btn-main">
                              Бүгдийг сагслах
                            </button>
                          )}
                        </li>
                      </ul>
                      {associations &&
                        associations.map((product, i) => {
                          const variant =
                            product?.variants && product?.variants[0]
                          return (
                            <div className="form-check" key={i}>
                              <Field
                                component={MyCheckbox}
                                name="checkboxOptions"
                                value={product.code}
                                id={`checkboxOptions${i}`}
                              />
                              <label
                                className="form-check-label"
                                htmlFor={`checkboxOptions${i}`}
                              >
                                <p className="name">
                                  {product?.name} - {variant?.name}
                                </p>
                                <p className="price">
                                  {Numeral(
                                    variant?.channelPricings?.FASHION_WEB?.price
                                  ).format('0,0')}{' '}
                                  ₮
                                </p>
                              </label>
                            </div>
                          )
                        })}
                    </form>
                  )}
                </Formik>
              </div>
            </section>
          </>
        ) : (
          <></>
        )}
        <RelatedProducts categorySlug={product?.mainTaxon?.slug} />
        <ViewUsers />
        {
          golomtModal && (
            <GolomtLoanModal
              isOpen={golomtModal}
              setOpen={setGolomtModal}
              products={[product]}
              selectedOptions={selectedOptions.name}
              handleAddToCart={handleAddToCart}
              price={salePrice}
              count={formRef.current?.values?.quantity}
            />
          )
        }
        {
          storepayModal && (
            <StorepayModal
              isOpen={storepayModal}
              setOpen={setStorepayModal}
              product={product}
              selectedOptions={selectedOptions.name}
              handleAddToCart={handleAddToCart}
              price={salePrice}
              count={formRef.current?.values?.quantity}
              isProduct={true}
            />
          )
        }
        {
          secretModal && (
            <SecretModal
              isOpen={secretModal}
              setOpen={setSecretModal}
              photoCode={valentinePhotoSwitch()}
            />
          )
        }
      </BasePage>
    </BaseLayout >
  )
}

export async function getStaticPaths() {
  const json = await new ProductsApi().getAll()
  if (!json) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    }
  }
  const products = json.data['hydra:member']
  const paths = products.map((product) => ({
    params: { slug: product.slug.toString() },
  }))
  return { paths, fallback: true }
}

export async function getStaticProps({ params }) {
  try {
    const json = await new ProductsApi().getProductBySlug(params.slug)
    const product = json.data
    if (product) {
      return { props: { product }, revalidate: 600 }
    } else {
      return { notFound: true };
    }
  } catch (err) {
    return { props: { errors: err.message } };
  }
}

export default Product
