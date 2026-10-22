import { ActionBar, Banner, Card, CardText, Loader, SubmitBar } from "@djb25/digit-ui-react-components"
import React, { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Link, useLocation, useHistory } from "react-router-dom"

const ResponseBillAmend = () => {
    const {state } = useLocation()
    const history = useHistory()
    const { t } = useTranslation()
    
    return <div>
         <Card>
            <Banner
                message={state ? t("WS_BILL_AMENDMENT_BANNER") : t("WS_BILL_AMENDMENT_FAILURE")}
                applicationNumber={state?.state?.Amendments?.[0]?.amendmentId}
                info={""}
                successful={state?.status ? true : false}
            />
            {!state.status ? null : <CardText>{t("WS_BILL_AMENDMENT_MESSAGE")}</CardText>}
            <ActionBar style={{ display: "flex", justifyContent: "flex-end", alignItems: "baseline" }}>
                <SubmitBar 
                    label={t("CORE_COMMON_GO_TO_HOME")} 
                    onSubmit={() => history.push(window.location.href.includes("/employee") ? `/digit-ui/employee` : `/digit-ui/citizen`)}
                    style={{ marginRight: "1rem" }}
                />
            </ActionBar>
        </Card>
    </div>
}

export default ResponseBillAmend