
import { createContext, useState } from "react";


const AuthContext = createContext({
    email: "",
    phone: "",
    fullName: "",
    role: "",
    avatar: "",
    id: ""
});

const AuthWrapper = (props) => {
    const [user, setUser] = useState({
        email: "",
        phone: "",
        fullName: "",
        role: "",
        avatar: "",
        id: ""
    })

    const [isAppLoading, setIsAppLoading] = useState(true)

    const [cart, setCart] = useState({
        id: 0,
        totalItems: 0,
        totalPrice: 0
    });

    return (
        <AuthContext.Provider value={{ user, setUser, isAppLoading, setIsAppLoading, setCart, cart }}>
            {props.children}
        </AuthContext.Provider>
    )
}

export {
    AuthContext, AuthWrapper
}