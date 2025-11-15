import { createContext, useEffect, useMemo, useState } from "react";
import { clearStoredAccessToken, getStoredAccessToken } from "../../utils/token";

const defaultUser = {
    email: "",
    phone: "",
    fullName: "",
    role: "",
    avatar: "",
    id: ""
};

const defaultCart = {
    id: 0,
    totalItems: 0,
    totalPrice: 0
};

const AuthContext = createContext({
    user: defaultUser,
    setUser: () => { },
    accessToken: "",
    setAccessToken: () => { },
    isAppLoading: true,
    setIsAppLoading: () => { },
    cart: defaultCart,
    setCart: () => { },
    resetAuthState: () => { }
});

const AuthWrapper = (props) => {
    const [user, setUser] = useState(defaultUser);
    const [accessToken, setAccessToken] = useState(getStoredAccessToken);
    const [isAppLoading, setIsAppLoading] = useState(true);
    const [cart, setCart] = useState(defaultCart);

    const resetAuthState = () => {
        setUser(defaultUser);
        setAccessToken("");
        setCart(defaultCart);
        if (typeof window !== "undefined") {
            clearStoredAccessToken();
        }
    };

    useEffect(() => {
        if (typeof window === "undefined") return;
        const handler = (event) => {
            setAccessToken(event.detail?.accessToken || "");
        };
        window.addEventListener('auth-token-refreshed', handler);
        return () => window.removeEventListener('auth-token-refreshed', handler);
    }, []);

    const contextValue = useMemo(() => ({
        user,
        setUser,
        accessToken,
        setAccessToken,
        isAppLoading,
        setIsAppLoading,
        cart,
        setCart,
        resetAuthState
    }), [user, accessToken, isAppLoading, cart]);

    return (
        <AuthContext.Provider value={contextValue}>
            {props.children}
        </AuthContext.Provider>
    );
};

export {
    AuthContext, AuthWrapper
};
