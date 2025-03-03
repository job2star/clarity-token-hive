;; TokenHive Contract
(define-fungible-token hive-token)

;; Constants
(define-constant contract-owner tx-sender)
(define-constant token-reward u10)
(define-constant err-owner-only (err u100))
(define-constant err-not-moderator (err u101))
(define-constant err-invalid-review (err u102))
(define-constant err-insufficient-balance (err u103))

;; Data Variables
(define-map moderators principal bool)
(define-map user-reputation principal uint)
(define-map reviews 
  uint 
  {
    author: principal,
    content: (string-utf8 500),
    product: (string-ascii 100),
    rating: uint,
    verified: bool
  }
)
(define-data-var review-count uint u0)

;; Authorization check
(define-private (is-moderator (user principal))
  (default-to false (map-get? moderators user))
)

;; Public functions
(define-public (submit-review (product (string-ascii 100)) (content (string-utf8 500)) (rating uint))
  (let 
    ((review-id (+ (var-get review-count) u1)))
    (if (and (>= rating u1) (<= rating u5))
      (begin
        (map-set reviews review-id
          {
            author: tx-sender,
            content: content,
            product: product,
            rating: rating,
            verified: false
          }
        )
        (var-set review-count review-id)
        (ok review-id)
      )
      err-invalid-review
    )
  )
)

(define-public (verify-review (review-id uint) (approve bool))
  (let ((review (unwrap! (map-get? reviews review-id) err-invalid-review)))
    (if (is-moderator tx-sender)
      (begin
        (map-set reviews review-id
          (merge review {verified: approve})
        )
        (if approve
          (begin
            (try! (ft-mint? hive-token token-reward (get author review)))
            (try! (increase-reputation (get author review)))
            (ok true)
          )
          (ok false)
        )
      )
      err-not-moderator
    )
  )
)

(define-public (add-moderator (user principal))
  (if (is-eq tx-sender contract-owner)
    (begin
      (map-set moderators user true)
      (ok true)
    )
    err-owner-only
  )
)

(define-public (transfer (amount uint) (recipient principal))
  (let ((sender-balance (ft-get-balance hive-token tx-sender)))
    (if (>= sender-balance amount)
      (begin
        (try! (ft-transfer? hive-token amount tx-sender recipient))
        (ok true)
      )
      err-insufficient-balance
    )
  )
)

;; Private functions
(define-private (increase-reputation (user principal))
  (let ((current-rep (default-to u0 (map-get? user-reputation user))))
    (map-set user-reputation user (+ current-rep u1))
    (ok true)
  )
)

;; Read only functions
(define-read-only (get-review (review-id uint))
  (ok (map-get? reviews review-id))
)

(define-read-only (get-reputation (user principal))
  (ok (default-to u0 (map-get? user-reputation user)))
)

(define-read-only (get-balance (user principal))
  (ok (ft-get-balance hive-token user))
)
