<?php
/**
 * Settings tab: Reviews.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$s        = quasar_get_settings();
$reviews  = Quasar_Reviews::all();
$computed = Quasar_Reviews::compute_aggregate();
$ar       = $s['aggregate_rating'];
?>
<form method="post" action="options.php">
	<?php settings_fields( 'quasar_settings_group' ); ?>
	<table class="form-table quasar-form-table">
		<tr>
			<th>Enable reviews</th>
			<td>
				<label>
					<input type="checkbox" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[reviews_enabled]" value="1" <?php checked( $s['reviews_enabled'], true ); ?> />
					Output Review + AggregateRating schema.
				</label>
			</td>
		</tr>
		<tr>
			<th>Aggregate Rating</th>
			<td>
				<p class="description">Leave blank to auto-compute from the reviews below (current: <?php echo esc_html( $computed['rating_value'] ?: 'n/a' ); ?> from <?php echo esc_html( $computed['review_count'] ?: 0 ); ?> reviews).</p>
				<div class="quasar-rating-fields">
					<label>Rating value <input type="text" class="small-text" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[aggregate_rating][rating_value]" value="<?php echo esc_attr( $ar['rating_value'] ); ?>" /></label>
					<label>Review count <input type="text" class="small-text" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[aggregate_rating][review_count]" value="<?php echo esc_attr( $ar['review_count'] ); ?>" /></label>
					<label>Worst <input type="text" class="small-text" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[aggregate_rating][worst]" value="<?php echo esc_attr( $ar['worst'] ); ?>" /></label>
					<label>Best <input type="text" class="small-text" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[aggregate_rating][best]" value="<?php echo esc_attr( $ar['best'] ); ?>" /></label>
				</div>
			</td>
		</tr>
		<tr>
			<th>Individual Reviews</th>
			<td>
				<div class="quasar-repeater quasar-reviews-repeater" id="quasar-reviews-repeater">
					<div class="quasar-repeater-rows">
						<?php if ( ! empty( $reviews ) ) : foreach ( $reviews as $r ) : ?>
							<div class="quasar-repeater-row quasar-review-row">
								<input type="text" name="<?php echo esc_attr( QUASAR_REVIEWS_OPTION ); ?>[][author]" value="<?php echo esc_attr( $r['author'] ); ?>" placeholder="Author name" class="quasar-review-author" />
								<select name="<?php echo esc_attr( QUASAR_REVIEWS_OPTION ); ?>[][rating]" class="quasar-review-rating">
									<?php for ( $i = 1; $i <= 5; $i++ ) : ?>
										<option value="<?php echo esc_attr( $i ); ?>" <?php selected( (int) $r['rating'], $i ); ?>><?php echo esc_html( $i ); ?></option>
									<?php endfor; ?>
								</select>
								<input type="text" name="<?php echo esc_attr( QUASAR_REVIEWS_OPTION ); ?>[][date]" value="<?php echo esc_attr( $r['date'] ); ?>" placeholder="YYYY-MM-DD" class="quasar-review-date" />
								<input type="url" name="<?php echo esc_attr( QUASAR_REVIEWS_OPTION ); ?>[][source]" value="<?php echo esc_attr( $r['source'] ); ?>" placeholder="Source URL" class="quasar-review-source" />
								<textarea name="<?php echo esc_attr( QUASAR_REVIEWS_OPTION ); ?>[][body]" placeholder="Review body" class="quasar-review-body"><?php echo esc_textarea( $r['body'] ); ?></textarea>
								<a href="#" class="quasar-repeater-remove">Remove</a>
							</div>
						<?php endforeach; else : ?>
							<div class="quasar-repeater-row quasar-review-row">
								<input type="text" name="<?php echo esc_attr( QUASAR_REVIEWS_OPTION ); ?>[][author]" value="" placeholder="Author name" class="quasar-review-author" />
								<select name="<?php echo esc_attr( QUASAR_REVIEWS_OPTION ); ?>[][rating]" class="quasar-review-rating">
									<?php for ( $i = 1; $i <= 5; $i++ ) : ?>
										<option value="<?php echo esc_attr( $i ); ?>"><?php echo esc_html( $i ); ?></option>
									<?php endfor; ?>
								</select>
								<input type="text" name="<?php echo esc_attr( QUASAR_REVIEWS_OPTION ); ?>[][date]" value="" placeholder="YYYY-MM-DD" class="quasar-review-date" />
								<input type="url" name="<?php echo esc_attr( QUASAR_REVIEWS_OPTION ); ?>[][source]" value="" placeholder="Source URL" class="quasar-review-source" />
								<textarea name="<?php echo esc_attr( QUASAR_REVIEWS_OPTION ); ?>[][body]" placeholder="Review body" class="quasar-review-body"></textarea>
								<a href="#" class="quasar-repeater-remove">Remove</a>
							</div>
						<?php endif; ?>
					</div>
					<a href="#" class="quasar-repeater-add button button-small">+ Add review</a>
				</div>
			</td>
		</tr>
	</table>
	<p class="submit quasar-submit-row">
		<?php submit_button( 'Save Reviews', 'primary', 'submit', false ); ?>
	</p>
</form>
