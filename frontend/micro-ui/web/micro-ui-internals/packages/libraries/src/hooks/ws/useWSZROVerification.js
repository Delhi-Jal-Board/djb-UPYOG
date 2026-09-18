import { useQuery, useQueryClient } from "react-query";
import { WSService } from "../../services/elements/WS";

const useWSZROVerification = ({ tenantId, filters, config = {} }) => {
  const queryClient = useQueryClient();
  const queryKey = ["WS_ZRO_VERIFICATION", tenantId, filters];

  const { isLoading, data, isError, isFetching } = useQuery(
    queryKey,
    () => WSService.searchZROVerification({ tenantId, ...filters }),
    {
      ...config,
      select: (data) => (config.select ? config.select(data) : data?.cases),
    }
  );

  return {
    isLoading,
    isFetching,
    data,
    isError,
    revalidate: () => queryClient.invalidateQueries(queryKey),
  };
};

export default useWSZROVerification;
