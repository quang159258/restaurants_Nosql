import { useContext, useEffect } from "react";
import { AuthContext } from "../context/auth.context";
import { getAccountAPI, getCart } from "../../services/api.service";

const LayoutApp = (props) => {
    const { user, setUser, isAppLoading, setIsAppLoading, setCart, cart } = useContext(AuthContext);
    useEffect(() => {
        fetchUserInfo();
        fetchCart();

    }, [])

    const fetchUserInfo = async () => {
        const res = await getAccountAPI();
        if (res.data) {
            setUser(res.data)
        }
        setIsAppLoading(false)
    }

    const fetchCart = async () => {
        const res = await getCart();
        if (res.data) {
            setCart(res.data)
        }
    }

    return (
        <>
            {props.children}
        </>
    )
}

export default LayoutApp