import { useContext, useEffect } from "react";
import { AuthContext } from "../context/auth.context";
import { getAccountAPI, getCart } from "../../services/api.service";

const LayoutApp = (props) => {
    const {
        user,
        setUser,
        isAppLoading,
        setIsAppLoading,
        setCart,
        cart,
        accessToken,
        resetAuthState
    } = useContext(AuthContext);

    useEffect(() => {
        const storedToken = accessToken ||
            (typeof window !== "undefined" &&
                (window.localStorage.getItem("access_token") ||
                    window.sessionStorage.getItem("access_token")));
        if (!storedToken) {
            setIsAppLoading(false);
            resetAuthState();
            return;
        }
        fetchUserInfo();
        fetchCartData();
    }, [accessToken]);

    const fetchUserInfo = async () => {
        try {
            const res = await getAccountAPI();
            if (res?.data) {
                setUser(res.data);
            }
        } catch (error) {
            if (error?.response?.status === 401) {
                resetAuthState();
            }
        } finally {
            setIsAppLoading(false);
        }
    };

    const fetchCartData = async () => {
        try {
            const res = await getCart();
            if (res?.data) {
                setCart(res.data);
            } else {
                setCart({ id: 0, totalItems: 0, totalPrice: 0 });
            }
        } catch (error) {
            setCart({ id: 0, totalItems: 0, totalPrice: 0 });
        }
    };

    return (
        <>
            {props.children}
        </>
    )
}

export default LayoutApp