import { useRouteError, isRouteErrorResponse, Link } from "react-router-dom";

export default function ErrorPage() {
    const error = useRouteError();

    let errorMessage;

    if (isRouteErrorResponse(error)) {
        // error: RouteErrorResponse
        errorMessage = error.statusText;
    } else if (error instanceof Error) {
        // error: Error
        errorMessage = error.message;
    } else {
        errorMessage = "Unknown error occurred.";
    }

    return (
        <div id="error-page">
            <h1>Oops!</h1>
            <p>Sorry, an unexpected error has occurred.</p>
            <p>
                <i>{errorMessage}</i>
            </p>
            <Link to={"./Homepage"}> back to home page</Link>
        </div>
    );
}
