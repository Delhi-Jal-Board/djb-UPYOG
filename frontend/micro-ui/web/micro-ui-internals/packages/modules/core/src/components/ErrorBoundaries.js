import React from "react";
import ErrorComponent from "./ErrorComponent";

const Redircter = () => {
  const path = Digit.UserService.getType() === "employee" ? "/digit-ui/employee/user/error" : "/digit-ui/citizen/error";


  if (
    window.location.href.includes("employee/user/error") ||
    window.location.href.includes("citizen/error") ||
    process.env.NODE_ENV === "development"
  ) {
  } else {
    window.location.href = path;
  }

  return null;
};

// const Redircter1 = () => {
//   const DigitObj = window?.Digit;

//   if (!DigitObj?.UserService) return null;

//   const userType = DigitObj.UserService.getType();

//   const path = userType === "employee" ? "/digit-ui/employee/user/error" : "/digit-ui/citizen/error";

//   const href = window.location.href;

//   const alreadyOnError = href.includes("/employee/user/error") || href.includes("/citizen/error");

//   if (alreadyOnError || process.env.NODE_ENV === "development") {
//     return null;
//   }

//   window.location.replace(path);

//   return null;
// };

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorStack: null, hasError: false };
  }

  static getDerivedStateFromError(error) {
    console.log("getDerivedStateFromError", error);
    // Update state so the next render will show the fallback UI.
    return { error: error?.message, hasError: true, errorStack: error?.stack };
  }

  componentDidCatch(error, errorInfo) {
    // Catch errors in any components below and re-render with error message
    console.log("componentDidCatch", error);
    this.setState({ error: error?.message, hasError: true, errorStack: error?.stack });
    // You can also log error messages to an error reporting service here
  }

  render() {
    if (this.state.hasError) {
      // ("UI-errorInfo", this.state?.errorStack);
      // ("UI-component-details", this.props);
      // You can render any custom fallback UI
      return (
        <div className="error-boundary">
          <Redircter />
          <ErrorComponent initData={this.props.initData} goToHome={this.props.goToHome} />

          {/* <summary>Something went wrong</summary>
          <details style={{ whiteSpace: "pre-wrap" }}>
            {this.state?.errorStack && this.state.errorStack.toString().substring(0, 600)}
            {this.state?.error}
          </details> */}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
