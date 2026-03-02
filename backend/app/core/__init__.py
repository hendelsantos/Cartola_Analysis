class CartolaAPIError(Exception):
    """Base exception for Cartola API errors."""

    def __init__(self, message: str = "Erro na API do Cartola", status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class NotFoundError(CartolaAPIError):
    def __init__(self, resource: str, resource_id: int | str):
        super().__init__(
            message=f"{resource} com ID {resource_id} não encontrado",
            status_code=404,
        )


class SyncError(CartolaAPIError):
    def __init__(self, message: str = "Erro ao sincronizar dados"):
        super().__init__(message=message, status_code=500)
